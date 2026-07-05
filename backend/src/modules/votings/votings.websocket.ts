import { prisma } from '@/db/client';
import { TokenPayload, verifyAccessToken } from '@/utils/helpers/jwt.helper';
import { Server, Socket } from 'socket.io';
import { VotingStatus } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

export const initWebsockets = (io: Server) => {
  // MIDDLEWARE: Sprawdzenie tokenu JWT przed dopuszczeniem do połączenia
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Brak tokenu autoryzacyjnego. Połączenie odrzucone.'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Nieprawidłowy lub przedawniony token.'));
    }

    socket.user = decoded;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(
      `Bezpieczne połączenie WS nawiązane: ${socket.id} (Użytkownik: ${socket.user?.userId})`,
    );

    // 1. Dołączenie do pokoju konkretnej sesji
    socket.on('join_session', async ({ sessionId }) => {
      const userId = socket.user?.userId;
      const numericSessionId = parseInt(sessionId?.toString() || '', 10);

      if (isNaN(numericSessionId)) return;

      socket.join(`session_${numericSessionId}`);
      console.log(`Użytkownik ${userId} dołączył do pokoju sesji: session_${numericSessionId}`);

      const activeVoting = await prisma.voting.findFirst({
        where: {
          agendaItem: { sessionId: numericSessionId },
          status: VotingStatus.OPEN,
        },
        include: { votes: true },
      });

      if (activeVoting) {
        socket.emit('voting_state_changed', activeVoting);
      }
    });

    // 2. Akcja Przewodniczącego: Rozpoczęcie głosowania
    socket.on('start_voting', async ({ votingId, sessionId }) => {
      if (socket.user?.role !== 'PRZEWODNICZACY' && socket.user?.role !== 'ADMINISTRATOR') {
        socket.emit('error', { message: 'Brak uprawnień do otwarcia głosowania.' });
        return;
      }

      const numericVotingId = parseInt(votingId?.toString() || '', 10);
      const numericSessionId = parseInt(sessionId?.toString() || '', 10);

      if (isNaN(numericVotingId) || isNaN(numericSessionId)) {
        socket.emit('error', { message: 'Niepoprawne parametry identyfikatorów.' });
        return;
      }

      try {
        const updatedVoting = await prisma.voting.update({
          where: { id: numericVotingId },
          data: { status: VotingStatus.OPEN },
          include: { votes: true },
        });

        io.to(`session_${numericSessionId}`).emit('voting_started', updatedVoting);
      } catch (err) {
        socket.emit('error', { message: 'Nie udało się uruchomić głosowania.' });
      }
    });

    // 3. Akcja Radnego: Oddanie głosu na żywo
    socket.on('cast_vote', async ({ votingId, choice, sessionId }) => {
      const userIdStr = socket.user?.userId;
      if (!userIdStr) return;

      const numericUserId = parseInt(userIdStr, 10);
      const numericVotingId = parseInt(votingId?.toString() || '', 10);
      const numericSessionId = parseInt(sessionId?.toString() || '', 10);

      if (isNaN(numericUserId) || isNaN(numericVotingId) || isNaN(numericSessionId)) {
        socket.emit('error', { message: 'Niepoprawne identyfikatory.' });
        return;
      }

      let mappedChoice: 'FOR' | 'AGAINST' | 'ABSTAIN' = 'ABSTAIN';
      if (choice === 'YES' || choice === 'FOR') mappedChoice = 'FOR';
      if (choice === 'NO' || choice === 'AGAINST') mappedChoice = 'AGAINST';

      try {
        await prisma.vote.upsert({
          where: {
            votingId_userId: { votingId: numericVotingId, userId: numericUserId },
          },
          update: { choice: mappedChoice },
          create: { votingId: numericVotingId, userId: numericUserId, choice: mappedChoice },
        });

        const allVotes = await prisma.vote.findMany({
          where: { votingId: numericVotingId },
        });

        const results = {
          for: allVotes.filter((v) => v.choice === 'FOR').length,
          against: allVotes.filter((v) => v.choice === 'AGAINST').length,
          abstain: allVotes.filter((v) => v.choice === 'ABSTAIN').length,
          total: allVotes.length,
        };

        io.to(`session_${numericSessionId}`).emit('vote_updated', { votingId: numericVotingId, results });
      } catch (err) {
        socket.emit('error', { message: 'Błąd podczas zapisu głosu.' });
      }
    });

    // 4. Akcja Przewodniczącego: Zakończenie głosowania
    socket.on('end_voting', async ({ votingId, sessionId }) => {
      if (socket.user?.role !== 'PRZEWODNICZACY' && socket.user?.role !== 'ADMINISTRATOR') {
        socket.emit('error', { message: 'Brak uprawnień do zamknięcia głosowania.' });
        return;
      }

      const numericVotingId = parseInt(votingId?.toString() || '', 10);
      const numericSessionId = parseInt(sessionId?.toString() || '', 10);

      if (isNaN(numericVotingId) || isNaN(numericSessionId)) {
        socket.emit('error', { message: 'Niepoprawne identyfikatory.' });
        return;
      }

      try {
        const finalizedVoting = await prisma.voting.update({
          where: { id: numericVotingId },
          data: { status: VotingStatus.CLOSED },
          include: { votes: true },
        });

        io.to(`session_${numericSessionId}`).emit('voting_completed', finalizedVoting);
      } catch (err) {
        socket.emit('error', { message: 'Nie udało się zakończyć głosowania.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Rozłączono bezpieczny socket: ${socket.id}`);
    });
  });
};
