import { prisma } from '@/db/client';
import { TokenPayload, verifyAccessToken } from '@/utils/helpers/jwt.helper';
import { Server, Socket } from 'socket.io';

// Rozszerzamy typ Socket o zdekodowany payload tokena, aby móc łatwo z niego korzystać
interface AuthenticatedSocket extends Socket {
    user?: TokenPayload;
}

export const initWebsockets = (io: Server) => {
    // MIDDLEWARE: Sprawdzenie tokenu JWT przed dopuszczeniem do połączenia
    io.use((socket: AuthenticatedSocket, next) => {
        // Front przekazuje token w obiekcie auth: { token: '...' }
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Brak tokenu autoryzacyjnego. Połączenie odrzucone.'));
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return next(new Error('Nieprawidłowy lub przedawniony token.'));
        }

        // Zapisujemy dane zalogowanego użytkownika w obiekcie socket
        socket.user = decoded;
        next();
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(
            `Bezpieczne połączenie WS nawiązane: ${socket.id} (Użytkownik: ${socket.user?.userId})`,
        );

        // 1. Dołączenie do pokoju konkretnej sesji (używamy już bezpiecznego userId z tokenu)
        socket.on('join_session', async ({ sessionId }) => {
            const userId = socket.user?.userId;

            socket.join(`session_${sessionId}`);
            console.log(`Użytkownik ${userId} dołączył do pokoju sesji: session_${sessionId}`);

            const activeVoting = await prisma.voting.findFirst({
                where: {
                    agendaItem: { sessionId: sessionId },
                    status: 'ACTIVE',
                },
                include: { votes: true },
            });

            if (activeVoting) {
                socket.emit('voting_state_changed', activeVoting);
            }
        });

        // 2. Akcja Przewodniczącego: Rozpoczęcie głosowania (dodatkowo weryfikujemy rolę z tokenu!)
        socket.on('start_voting', async ({ votingId, sessionId }) => {
            if (socket.user?.role !== 'PRZEWODNICZACY' && socket.user?.role !== 'ADMINISTRATOR') {
                socket.emit('error', { message: 'Brak uprawnień do otwarcia głosowania.' });
                return;
            }

            try {
                const updatedVoting = await prisma.voting.update({
                    where: { id: votingId },
                    data: { status: 'ACTIVE' },
                    include: { votes: true },
                });

                io.to(`session_${sessionId}`).emit('voting_started', updatedVoting);
            } catch (err) {
                socket.emit('error', { message: 'Nie udało się uruchomić głosowania.' });
            }
        });

        // 3. Akcja Radnego: Oddanie głosu na żywo (userId pobieramy bezpośrednio z bezpiecznego tokenu)
        socket.on('cast_vote', async ({ votingId, value, sessionId }) => {
            const userId = socket.user?.userId;
            if (!userId) return;

            try {
                await prisma.vote.upsert({
                    where: {
                        votingId_userId: { votingId, userId },
                    },
                    update: { value },
                    create: { votingId, userId, value },
                });

                const allVotes = await prisma.vote.findMany({
                    where: { votingId },
                });

                const results = {
                    yes: allVotes.filter((v) => v.value === 'YES').length,
                    no: allVotes.filter((v) => v.value === 'NO').length,
                    abstain: allVotes.filter((v) => v.value === 'ABSTAIN').length,
                    total: allVotes.length,
                };

                io.to(`session_${sessionId}`).emit('vote_updated', { votingId, results });
            } catch (err) {
                socket.emit('error', { message: 'Błąd podczas zapisu głosu.' });
                return;
            }
        });

        // 4. Akcja Przewodniczącego: Zakończenie głosowania (z weryfikacją roli)
        socket.on('end_voting', async ({ votingId, sessionId }) => {
            if (socket.user?.role !== 'PRZEWODNICZACY' && socket.user?.role !== 'ADMINISTRATOR') {
                socket.emit('error', { message: 'Brak uprawnień do zamknięcia głosowania.' });
                return;
            }

            try {
                const finalizedVoting = await prisma.voting.update({
                    where: { id: votingId },
                    data: { status: 'COMPLETED' },
                    include: { votes: true },
                });

                io.to(`session_${sessionId}`).emit('voting_completed', finalizedVoting);
            } catch (err) {
                socket.emit('error', { message: 'Nie udało się zakończyć głosowania.' });
                return;
            }
        });

        socket.on('disconnect', () => {
            console.log(`Rozłączono bezpieczny socket: ${socket.id}`);
        });
    });
};
