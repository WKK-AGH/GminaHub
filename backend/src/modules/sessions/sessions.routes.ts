import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { validateBody, validateIdParam } from '@/middleware/validate';
import { Router } from 'express';
import {
    addAgendaItem,
    createOrUpdateSummary,
    createSession,
    getAllSessions,
    getSessionById,
    getSessionStatistics,
    updateSessionStatus,
} from './sessions.controller';
import { createSessionSchema } from './sessions.validation';

const router = Router();

router.get('/', getAllSessions);
router.get('/:id', validateIdParam, getSessionById);
router.get('/:id/statistics', authenticateJWT, validateIdParam, getSessionStatistics);

router.patch(
    '/:id/status',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    updateSessionStatus,
);

router.post(
    '/:id/agenda',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    addAgendaItem,
);

router.post(
    '/',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateBody(createSessionSchema),
    createSession,
);

router.post(
    '/:id/summary',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    createOrUpdateSummary,
);

export default router;
