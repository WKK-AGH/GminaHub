import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { logger } from '@/utils/logger';

// GET /api/sessions - Pobieranie wszystkich sesji
export const getAllSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { scheduledDate: 'asc' },
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
export const createSession = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { title, scheduledDate, committeeId, quorumRequired } = req.body;

    if (!title || !scheduledDate || quorumRequired === undefined) {
      return res.status(400).json({ success: false, message: 'Tytuł, data planowana oraz wymagane quorum są polami obowiązkowymi.' });
    }

    const newSession = await prisma.session.create({
      data: {
        title,
        scheduledDate: new Date(scheduledDate),
        committeeId: committeeId ? parseInt(committeeId.toString(), 10) : null,
        quorumRequired: parseInt(quorumRequired.toString(), 10),
        status: 'SCHEDULED',
      },
    });

    logger.info(`Utworzono nową sesję: ${title} (ID: ${newSession.id})`);

    return res.status(201).json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    logger.error('Błąd podczas tworzenia sesji', error);
    return next(error);
  }
};

// GET /api/sessions/:id - Pobieranie sesji po ID
export const getSessionById = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const sessionId = parseInt(paramId, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowy identyfikator sesji. Musi być liczbą.'
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        committee: true,
        agendaItems: {
          orderBy: { position: 'asc' },
          include: {
            documents: true,
            votings: {
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

// PATCH /api/sessions/:id/status - Zmiana statusu sesji
export const updateSessionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const sessionId = parseInt(paramId, 10);
    const { status } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator sesji musi być liczbą.' });
    }

    if (!status || !['SCHEDULED', 'ACTIVE', 'CONCLUDED'].includes(status.toString())) {
      return res.status(400).json({ success: false, message: 'Niepoprawny lub brakujący status sesji.' });
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: status as 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED' }
    });

    logger.info(`Zmieniono status sesji ${sessionId} na ${status}`);
    return res.status(200).json({ success: true, data: updatedSession });
  } catch (error) {
    logger.error('Błąd podczas zmiany statusu sesji', error);
    return next(error);
  }
};

// POST /api/sessions/:id/agenda - Dodawanie punktu agendy
export const addAgendaItem = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const sessionId = parseInt(paramId, 10);
    const { title, position } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator sesji musi być liczbą.' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tytuł punktu agendy jest wymagany.' });
    }

    const parsedPosition = position ? parseInt(position.toString(), 10) : 0;
    if (isNaN(parsedPosition)) {
      return res.status(400).json({ success: false, message: 'Parametr position musi być poprawną liczbą.' });
    }

    const newItem = await prisma.agendaItem.create({
      data: {
        title,
        position: parsedPosition,
        sessionId,
        votings: {
          create: {
            title: `Głosowanie: ${title}`,
            status: 'PENDING'
          }
        }
      },
      include: { votings: true }
    });

    logger.info(`Dodano nowy punkt agendy: "${title}" do sesji ${sessionId}`);
    return res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    logger.error('Błąd podczas dodawania punktu agendy', error);
    return next(error);
  }
};

// GET /api/sessions/:id/statistics - Statystyki głosowań z danej sesji
export const getSessionStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const sessionId = parseInt(paramId, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator sesji musi być liczbą.' });
    }

    const agendaItems = await prisma.agendaItem.findMany({
      where: { sessionId },
      include: {
        votings: {
          where: { status: 'CLOSED' },
          include: { votes: true }
        }
      }
    });

    let totalVotingsCount = 0;
    let globalFor = 0;
    let globalAgainst = 0;
    let globalAbstain = 0;

    const votingDetails = agendaItems.flatMap(item =>
      item.votings.map(v => {
        totalVotingsCount++;

        const forVotes = v.votes.filter(vote => vote.choice === 'FOR').length;
        const againstVotes = v.votes.filter(vote => vote.choice === 'AGAINST').length;
        const abstainVotes = v.votes.filter(vote => vote.choice === 'ABSTAIN').length;

        globalFor += forVotes;
        globalAgainst += againstVotes;
        globalAbstain += abstainVotes;

        return {
          votingId: v.id,
          title: v.title,
          results: { for: forVotes, against: againstVotes, abstain: abstainVotes, total: v.votes.length }
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalVotings: totalVotingsCount,
          globalFor,
          globalAgainst,
          globalAbstain,
          globalTotalVotes: globalFor + globalAgainst + globalAbstain
        },
        votings: votingDetails
      }
    });
  } catch (error) {
    logger.error('Błąd podczas generowania statystyk sesji', error);
    return next(error);
  }
};

// POST /api/sessions/:id/summary - Tworzenie lub aktualizacja protokołu sesji
export const createOrUpdateSummary = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const paramId = req.params.id ? req.params.id.toString() : '';
    const sessionId = parseInt(paramId, 10);
    const { attendanceCount, notes, pdfExportUrl } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator sesji musi być liczbą.' });
    }

    const attendanceStr = attendanceCount !== undefined ? attendanceCount.toString() : '';
    const parsedAttendance = parseInt(attendanceStr, 10);

    if (isNaN(parsedAttendance)) {
      return res.status(400).json({ success: false, message: 'Liczba obecności (attendanceCount) jest wymagana i musi być liczbą.' });
    }

    const summary = await prisma.sessionSummary.upsert({
      where: { sessionId },
      update: {
        attendanceCount: parsedAttendance,
        notes,
        pdfExportUrl
      },
      create: {
        sessionId,
        attendanceCount: parsedAttendance,
        notes,
        pdfExportUrl
      }
    });

    logger.info(`Zapisano protokół dla sesji: ${sessionId}`);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    logger.error('Błąd podczas zapisu protokołu sesji', error);
    return next(error);
  }
};
