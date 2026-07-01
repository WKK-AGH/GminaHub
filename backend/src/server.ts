import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/modules/auth/auth.routes';
import committeesRoutes from '@/modules/committees/committees.routes';
import sessionsRoutes from '@/modules/sessions/sessions.routes';
import usersRoutes from '@/modules/users/users.routes';
import votingsRoutes from '@/modules/votings/votings.routes';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initWebsockets } from './modules/votings/votings.websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
    cors({
        origin: frontendUrl,
        credentials: true,
    }),
);

// Konfiguracja Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { message: 'Zbyt wiele żądań, spróbuj ponownie później.' },
});
app.use('/api', limiter);

app.get('/', (_req, res) => {
    res.status(200).json({
        message: 'Witamy w API systemu e-Sesja: Cyfrowa Rada Gminy',
    });
});

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/votings', votingsRoutes);
app.use('/api/committees', committeesRoutes);

app.use(errorHandler);

// Inicjalizacja logiki WebSocketów
initWebsockets(io);

// Zmieniamy app.listen na httpServer.listen
httpServer.listen(PORT, () => {
    console.log(`Serwer e-Sesja z obsługą WebSockets działa na porcie ${PORT}`);
});
