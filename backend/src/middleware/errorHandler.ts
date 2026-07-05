import { NextFunction, Request, Response } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Błąd backendu:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Wewnętrzny błąd serwera';

    res.status(statusCode).json({
        success: false,
        message,
        // Pokazuj stack trace tylko w trybie deweloperskim
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

