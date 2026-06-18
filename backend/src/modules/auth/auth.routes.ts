import { Router } from 'express';
import { login, logout, refresh, register } from './auth.controller';
import { validateBody } from '@/middleware/validate';
import { loginSchema, registerSchema } from './auth.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

router.post('/login', validateBody(loginSchema), login);

router.post('/logout', logout);

router.post('/refresh', refresh);

router.post(
  '/register',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR'),
  validateBody(registerSchema),
  register
);

export default router;
