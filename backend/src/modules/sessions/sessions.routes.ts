import { Router } from 'express';
import { getAllSessions, createSession, getSessionById, updateSessionStatus, addAgendaItem, getSessionStatistics, createOrUpdateSummary } from './sessions.controller';
import { validateBody } from '@/middleware/validate';
import { createSessionSchema } from './sessions.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';


const router = Router();

router.get('/', getAllSessions);
router.get('/:id', getSessionById);
router.get('/:id/statistics', authenticateJWT, getSessionStatistics);
router.patch(
  '/:id/status',
   authenticateJWT,
    authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
     updateSessionStatus
  );

router.post(
  '/:id/agenda',
   authenticateJWT,
    authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
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
     createOrUpdateSummary
);
export default router;
