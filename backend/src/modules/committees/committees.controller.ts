import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { logger } from '@/utils/logger';

// GET /api/committees - Pobieranie wszystkich komisji wraz z członkami
export const getAllCommittees = async (_req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const committees = await prisma.committee.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          }
        }
      }
    });

    return res.status(200).json({ success: true, data: committees });
  } catch (error) {
    logger.error('Błąd podczas pobierania komisji', error);
    return next(error);
  }
};

// POST /api/committees - Tworzenie nowej komisji
export const createCommittee = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { name } = req.body;

    const existing = await prisma.committee.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Komisja o tej nazwie już istnieje.' });
    }

    const newCommittee = await prisma.committee.create({
      data: { name }
    });

    logger.info(`Utworzono komisję: ${name} (ID: ${newCommittee.id})`);
    return res.status(201).json({ success: true, data: newCommittee });
  } catch (error) {
    logger.error('Błąd podczas tworzenia komisji', error);
    return next(error);
  }
};

// POST /api/committees/:id/members - Dodawanie członka do komisji
export const addCommitteeMember = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const committeeId = req.params.id as string;
    const { userId } = req.body;

    // Sprawdzenie czy użytkownik istnieje
    const userExist = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExist) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika.' });
    }

    // Dodanie relacji członkostwa
    const membership = await prisma.committeeMember.create({
      data: { committeeId, userId }
    });

    logger.info(`Dodano użytkownika ${userId} do komisji ${committeeId}`);
    return res.status(201).json({ success: true, data: membership });
  } catch (error) {
    // Łapiemy błąd naruszenia unikalności z Prisma (P2002)
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Ten radny jest już członkiem tej komisji.' });
    }
    logger.error('Błąd podczas dodawania członka do komisji', error);
    return next(error);
  }
};
