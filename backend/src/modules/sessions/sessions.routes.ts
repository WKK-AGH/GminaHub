import { Router } from 'express';
import {
  getAllSessions,
  createSession,
  getSessionById,
  updateSessionStatus,
  addAgendaItem,
  getSessionStatistics,
  createOrUpdateSummary
} from './sessions.controller';
import { validateBody, validateIdParam } from '@/middleware/validate';
import { createSessionSchema } from './sessions.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

router.get('/', getAllSessions);
router.get('/:id', validateIdParam, getSessionById);
router.get('/:id/statistics', authenticateJWT, validateIdParam, getSessionStatistics);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateIdParam,
  updateSessionStatus
);

router.post(
  '/:id/agenda',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateIdParam,
  addAgendaItem
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateBody(createSessionSchema),
  createSession
);

router.post(
  '/:id/summary',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateIdParam,
  createOrUpdateSummary
);

export default router;
