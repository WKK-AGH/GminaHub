import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { logger } from '@/utils/logger';
import { VotingStatus } from '@prisma/client';

// PATCH /api/votings/:id/start - Aktywacja głosowania
export const startVoting = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const id = parseInt(paramId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Identyfikator głosowania musi być liczbą.' });
    }

    const voting = await prisma.voting.findUnique({
      where: { id },
      include: { agendaItem: true }
    });

    if (!voting) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono głosowania.' });
    }

    // Weryfikacja czy w tej sesji trwa już inne otwarte (OPEN) głosowanie
    const activeVotingExist = await prisma.voting.findFirst({
      where: {
        status: VotingStatus.OPEN,
        agendaItem: {
          id: voting.agendaItemId
        }
      }
    });

    if (activeVotingExist) {
      return res.status(400).json({ success: false, message: 'W tej sesji trwa już inne aktywne głosowanie.' });
    }

    const updatedVoting = await prisma.voting.update({
      where: { id },
      data: { status: VotingStatus.OPEN }
    });

    logger.info(`Głosowanie aktywowane: ${updatedVoting.title} (ID: ${updatedVoting.id})`);

    return res.status(200).json({
      success: true,
      data: updatedVoting
    });
  } catch (error) {
    logger.error('Błąd podczas uruchamiania głosowania', error);
    return next(error);
  }
};

// PATCH /api/votings/:id/end - Zakończenie głosowania
export const endVoting = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const id = parseInt(paramId, 10);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Identyfikator głosowania musi być liczbą.' });
    }

    const voting = await prisma.voting.findUnique({ where: { id } });

    if (!voting) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono głosowania.' });
    }

    const finalizedVoting = await prisma.voting.update({
      where: { id },
      data: { status: VotingStatus.CLOSED }
    });

    logger.info(`Głosowanie zakończone: ${finalizedVoting.title} (ID: ${finalizedVoting.id})`);

    return res.status(200).json({
      success: true,
      data: finalizedVoting
    });
  } catch (error) {
    logger.error('Błąd podczas kończenia głosowania', error);
    return next(error);
  }
};
