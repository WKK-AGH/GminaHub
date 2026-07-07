import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { validateIdParam } from '@/middleware/validate';
import { Router } from 'express';
import { endVoting, startVoting } from './votings.controller';

const router = Router();

router.patch(
    '/:id/start',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    startVoting,
);

router.patch(
    '/:id/end',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    endVoting,
);

export default router;
