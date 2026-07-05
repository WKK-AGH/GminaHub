import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { logger } from '@/utils/logger';

// GET /api/sessions - Pobieranie wszystkich sesji
export const getAllSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: {
        committee: true,
      }
    });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logger.error('Błąd podczas pobierania sesji', error);
    next(error);
  }
};

// POST /api/sessions - Tworzenie nowej sesji
export const createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, scheduledAt, committeeId } = req.body;

    const newSession = await prisma.session.create({
      data: {
        title,
        scheduledAt: new Date(scheduledAt),
        committeeId: committeeId || null,
        status: 'PLANNED',
      },
    });

    logger.info(`Utworzono nową sesję: ${title} (ID: ${newSession.id})`);

    res.status(201).json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    logger.error('Błąd podczas tworzenia sesji', error);
    next(error);
  }
};

export const getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowy lub brakujący identyfikator sesji.'
            });
        }

        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                committee: true,
                agendaItems: {
                    orderBy: { order: 'asc' },
                    include: {
                        documents: true,
                        voting: {
                            include: {
                                votes: true
                            }
                        }
                    }
                },
                summary: true
            }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Nie znaleziono sesji.' });
        }

        return res.status(200).json({ success: true, data: session });
    } catch (error) {
        return next(error);
    }
};

// PATCH /api/sessions/:id/status - Zmiana statusu sesji (np. PLANNED -> ACTIVE -> FINISHED)
export const updateSessionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // 'PLANNED', 'ACTIVE', 'FINISHED'

    const updatedSession = await prisma.session.update({
      where: { id },
      data: { status }
    });

    logger.info(`Zmieniono status sesji ${id} na ${status}`);
    return res.status(200).json({ success: true, data: updatedSession });
  } catch (error) {
    logger.error('Błąd podczas zmiany statusu sesji', error);
    return next(error);
  }
};

// POST /api/sessions/:id/agenda - Dodawanie punktu agendy wraz z inicjalizacją głosowania
export const addAgendaItem = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const sessionId = req.params.id as string;
    const { title, order } = req.body;

    // Podstawowa walidacja wejścia
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tytuł punktu agendy jest wymagany.' });
    }

    const parsedOrder = order ? parseInt(order.toString(), 10) : 0;
    if (isNaN(parsedOrder)) {
      return res.status(400).json({ success: false, message: 'Parametr order musi być poprawną liczbą.' });
    }

    // Tworzymy punkt agendy i od razu przypisujemy do niego puste głosowanie
    const newItem = await prisma.agendaItem.create({
      data: {
        title,
        order: parsedOrder,
        sessionId,
        voting: {
          create: {
            title: `Głosowanie: ${title}`,
            status: 'PENDING'
          }
        }
      },
      include: { voting: true }
    });

    logger.info(`Dodano nowy punkt agendy: "${title}" do sesji ${sessionId}`);
    return res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Błąd podczas dodawania punktu agendy', error);
    return next(error);
  }
};

// GET /api/sessions/:id/statistics - Generowanie statystyk z głosowań danej sesji
export const getSessionStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const sessionId = req.params.id as string;

    // Pobieramy punkty agendy z tej sesji wraz z ich zakończonymi głosowaniami i wszystkimi głosami
    const agendaItems = await prisma.agendaItem.findMany({
      where: { sessionId },
      include: {
        voting: {
          where: { status: 'COMPLETED' },
          include: { votes: true }
        }
      }
    });

    let totalVotingsCount = 0;
    let globalYes = 0;
    let globalNo = 0;
    let globalAbstain = 0;

    const votingDetails = agendaItems.flatMap(item =>
      item.voting.map(v => {
        totalVotingsCount++;
        const yes = v.votes.filter(vote => vote.value === 'YES').length;
        const no = v.votes.filter(vote => vote.value === 'NO').length;
        const abstain = v.votes.filter(vote => vote.value === 'ABSTAIN').length;

        globalYes += yes;
        globalNo += no;
        globalAbstain += abstain;

        return {
          votingId: v.id,
          title: v.title,
          results: { yes, no, abstain, total: v.votes.length }
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalVotings: totalVotingsCount,
          globalYes,
          globalNo,
          globalAbstain,
          globalTotalVotes: globalYes + globalNo + globalAbstain
        },
        votings: votingDetails
      }
    });
  } catch (error) {
    logger.error('Błąd podczas generowania statystyk sesji', error);
    return next(error);
  }
};

// POST /api/sessions/:id/summary - Tworzenie lub aktualizacja protokołu z sesji (Relacja 1-do-1)
export const createOrUpdateSummary = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const sessionId = req.params.id as string;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Treść protokołu nie może być pusta.' });
    }

    const summary = await prisma.sessionSummary.upsert({
      where: { sessionId },
      update: { content },
      create: { sessionId, content }
    });

    logger.info(`Zapisano protokół dla sesji: ${sessionId}`);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    logger.error('Błąd podczas zapisu protokołu sesji', error);
    return next(error);
  }
};
