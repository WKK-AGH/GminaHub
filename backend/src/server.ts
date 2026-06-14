import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/modules/auth/auth.routes';
import sessionsRoutes from '@/modules/sessions/sessions.routes';
import usersRoutes from '@/modules/users/users.routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { message: 'Zbyt wiele żądań, spróbuj ponownie później.' },
});
app.use('/api', limiter);

app.get('/', (_req, res) => {
    res.status(200).json({
        message: 'Witamy w API systemu e-Sesja: Cyfrowa Rada Gminy'
    });
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/users', usersRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Serwer e-Sesja działa na porcie ${PORT}`);
});
