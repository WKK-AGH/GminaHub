import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';
import { Router } from 'express';
import { getAllUsers } from './users.controller';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'CHAIRPERSON'), getAllUsers);

export default router;
