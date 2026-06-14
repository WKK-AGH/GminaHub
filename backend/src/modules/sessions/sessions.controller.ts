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
