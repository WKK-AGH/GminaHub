import { Router } from 'express';
import { startVoting, endVoting } from './votings.controller';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { validateIdParam } from '@/middleware/validate';

const router = Router();

router.patch(
  '/:id/start',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateIdParam,
  startVoting
);

router.patch(
  '/:id/end',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateIdParam,
  endVoting
);

export default router;
