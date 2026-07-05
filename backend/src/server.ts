import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import {errorHandler} from '@/middleware/errorHandler';
import authRoutes from '@/modules/auth/auth.routes';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Ładowanie zmiennych środowiskowych
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE BEZPIECZEŃSTWA I OPTYMALIZACJI ──
app.use(helmet()); // Nagłówki HTTP chroniące aplikację
app.use(compression()); // Kompresja Gzip dla szybszego działania
app.use(express.json()); // Parsowanie JSON
app.use(cookieParser()); // Parsowanie ciasteczek (pod Refresh Token)

// Konfiguracja CORS pod frontend (React)
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true, // Wymagane, aby przysyłać ciasteczka HttpOnly
    }),
);

// Ograniczenie spamu do API (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    limit: 100, // Maksymalnie 100 żądań z jednego IP
    message: { message: 'Zbyt wiele żądań, spróbuj ponownie później.' },
});
app.use('/api', limiter);

// ── TESTOWY ENDPOINT ──
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ── GLOBALNA OBSŁUGA BŁĘDÓW ──
app.use(errorHandler);

// ── ROUTING ──
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Serwer e-Sesja działa na porcie ${PORT}`);
});
