import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { validateBody, validateIdParam } from '@/middleware/validate';
import { Router } from 'express';
import { addCommitteeMember, createCommittee, getAllCommittees } from './committees.controller';
import { addMemberSchema, createCommitteeSchema } from './committees.validation';

const router = Router();

router.get('/', authenticateJWT, getAllCommittees);

router.post(
    '/',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateBody(createCommitteeSchema),
    createCommittee,
);

router.post(
    '/:id/members',
    authenticateJWT,
    authorizeRoles('ADMIN', 'CHAIRPERSON'),
    validateIdParam,
    validateBody(addMemberSchema),
    addCommitteeMember,
);

export default router;
