import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/helpers/jwt.helper';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Brak tokenu autoryzacyjnego lub nieprawidłowy format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token nie został dostarczony',
    });
    return;
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      message: 'Token wygasł lub jest nieprawidłowy',
    });
    return;
  }

  req.user = decoded;
  next();
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Brak autoryzacji – użytkownik niezalogowany',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Brak uprawnień do wykonania tej operacji',
      });
      return;
    }

    next();
  };
};
