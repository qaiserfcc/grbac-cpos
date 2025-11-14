import { Router } from 'express';

import { login, logout, refresh, register } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/register', register);

export default router;
