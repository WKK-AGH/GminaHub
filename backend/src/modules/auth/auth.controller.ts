import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { comparePassword, hashPassword } from '@/utils/helpers/hash.helper';
import { generateTokens, verifyRefreshToken } from '@/utils/helpers/jwt.helper';
import { logger } from '@/utils/logger';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      logger.warn(`Nieudana próba logowania na email: ${email} (Brak użytkownika)`);
      res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`Nieudana próba logowania dla użytkownika: ${email} (Błędne hasło)`);
      res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id.toString(),
      role: user.role.name
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info(`Użytkownik ${user.email} (${user.role.name}) zalogował się pomyślnie.`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name
      }
    });
  } catch (error) {
    logger.error(`Błąd krytyczny podczas logowania użytkownika`, error);
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Wylogowano pomyślnie'
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Brak tokenu odświeżania' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      res.status(401).json({ success: false, message: 'Nieprawidłowy lub wygasły token odświeżania' });
      return;
    }

    const numericUserId = parseInt(decoded.userId.toString(), 10);

    if (isNaN(numericUserId)) {
      res.status(401).json({ success: false, message: 'Nieprawidłowy format identyfikatora w tokenie' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: numericUserId },
      include: { role: true }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Użytkownik powiązany z tokenem nie istnieje' });
      return;
    }

    const tokens = generateTokens({
      userId: user.id.toString(),
      role: user.role.name
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    logger.error('Błąd podczas odświeżania tokenu', error);
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role: roleName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Użytkownik o podanym adresie email już istnieje' });
      return;
    }

    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      res.status(400).json({ success: false, message: `Rola '${roleName}' nie istnieje w systemie` });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        roleId: role.id
      },
      include: {
        role: true
      }
    });

    logger.info(`Administrator pomyślnie zarejestrował nowego użytkownika: ${newUser.email} (Rola: ${newUser.role.name})`);

    res.status(201).json({
      success: true,
      message: 'Użytkownik zarejestrowany pomyślnie',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role.name
      }
    });
  } catch (error) {
    logger.error('Błąd podczas rejestracji użytkownika', error);
    next(error);
  }
};
