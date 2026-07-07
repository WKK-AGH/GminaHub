import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { validateBody } from '@/middleware/validate';
import { Router } from 'express';
import { login, logout, refresh, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/login', validateBody(loginSchema), login);

router.post('/logout', logout);

router.post('/refresh', refresh);

router.post(
    '/register',
    authenticateJWT,
    authorizeRoles('ADMIN'),
    validateBody(registerSchema),
    register,
);

export default router;
