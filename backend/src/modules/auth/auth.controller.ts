import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/db/client';
import { comparePassword, hashPassword } from '@/utils/helpers/hash.helper';
import { generateTokens, verifyRefreshToken } from '@/utils/helpers/jwt.helper';
import { logger } from '@/utils/logger';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { login: userLogin, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { login: userLogin },
      include: { role: true }
    });

    if (!user) {
      logger.warn(`Nieudana próba logowania na login: ${userLogin} (Brak użytkownika)`);
      res.status(401).json({ success: false, message: 'Nieprawidłowy login lub hasło' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Nieudana próba logowania dla użytkownika: ${userLogin} (Błędne hasło)`);
      res.status(401).json({ success: false, message: 'Nieprawidłowy login lub hasło' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      role: user.role.name
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
    });

    logger.info(`Użytkownik ${user.login} (${user.role.name}) zalogował się pomyślnie.`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
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
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Nieprawidłowy lub wygasły token odświeżania' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Użytkownik powiązany z tokenem nie istnieje' });
      return;
    }

    const tokens = generateTokens({
      userId: user.id,
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
    const { login: userLogin, password, firstName, lastName, role: roleName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { login: userLogin }
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Użytkownik o podanym loginie już istnieje' });
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
        login: userLogin,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: role.id
      },
      include: {
        role: true
      }
    });

    logger.info(`Administrator pomyślnie zarejestrował nowego użytkownika: ${newUser.login} (Rola: ${newUser.role.name})`);

    res.status(201).json({
      success: true,
      message: 'Użytkownik zarejestrowany pomyślnie',
      user: {
        id: newUser.id,
        login: newUser.login,
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
