import { Router } from 'express';
import { getAllCommittees, createCommittee, addCommitteeMember } from './committees.controller';
import { validateBody } from '@/middleware/validate';
import { createCommitteeSchema, addMemberSchema } from './committees.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

// Każdy zalogowany może przeglądać komisje
router.get('/', authenticateJWT, getAllCommittees);

// Tylko Administrator i Przewodniczący mogą tworzyć i zarządzać składem komisji
router.post(
  '/',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateBody(createCommitteeSchema),
  createCommittee
);

router.post(
  '/:id/members',
  authenticateJWT,
  authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'),
  validateBody(addMemberSchema),
  addCommitteeMember
);

export default router;
