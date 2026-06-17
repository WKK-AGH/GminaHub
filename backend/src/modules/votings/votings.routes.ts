import { Router } from 'express';
import { startVoting, endVoting } from './votings.controller';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

// Tylko administrator lub przewodniczący mogą zarządzać stanem głosowania
router.patch('/:id/start', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'), startVoting);
router.patch('/:id/end', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'), endVoting);

export default router;
