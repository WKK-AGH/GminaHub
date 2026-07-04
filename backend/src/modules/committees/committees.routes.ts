import { Router } from 'express';
import { getAllCommittees, createCommittee, addCommitteeMember } from './committees.controller';
import { validateBody, validateIdParam } from '@/middleware/validate';
import { createCommitteeSchema, addMemberSchema } from './committees.validation';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getAllCommittees);

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
  validateIdParam,
  validateBody(addMemberSchema),
  addCommitteeMember
);

export default router;
