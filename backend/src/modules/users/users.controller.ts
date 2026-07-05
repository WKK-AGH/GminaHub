import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { logger } from '@/utils/logger';

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Błąd podczas pobierania listy użytkowników', error);
    next(error);
  }
};
