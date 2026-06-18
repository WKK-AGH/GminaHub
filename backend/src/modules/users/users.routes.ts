import { Router } from 'express';
import { getAllUsers } from './users.controller';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'PRZEWODNICZACY'), getAllUsers);

export default router;
