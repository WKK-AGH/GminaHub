import { Router } from 'express';
import { getAllSessions, createSession } from './sessions.controller';
import { validateBody } from '@/middleware/validate';
import { createSessionSchema } from './sessions.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

router.get('/', getAllSessions);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateBody(createSessionSchema),
  createSession
);

export default router;
