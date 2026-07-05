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
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: {
                  select: { name: true }
                }
              }
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

    const existing = await prisma.committee.findFirst({ where: { name } });
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
    const paramId = req.params.id ? req.params.id.toString() : '';
    const committeeId = parseInt(paramId, 10);
    const { userId } = req.body;

    if (isNaN(committeeId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator komisji musi być liczbą.' });
    }

    const parsedUserId = parseInt(userId?.toString() || '', 10);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ success: false, message: 'Identyfikator użytkownika musi być liczbą.' });
    }

    // Sprawdzenie czy użytkownik istnieje
    const userExist = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!userExist) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika.' });
    }

    // Dodanie relacji członkostwa
    const membership = await prisma.committeeMember.create({
      data: {
        committeeId,
        userId: parsedUserId
      }
    });

    logger.info(`Dodano użytkownika ${parsedUserId} do komisji ${committeeId}`);
    return res.status(201).json({ success: true, data: membership });
  } catch (error) {

    if ((error as any).code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Ten radny jest już członkiem tej komisji.' });
    }
    logger.error('Błąd podczas dodgingu członka do komisji', error);
    return next(error);
  }
};
