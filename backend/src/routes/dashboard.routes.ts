import { Router } from 'express';
import { getAccessibleWidgets } from '../controllers/dashboard.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);
router.get('/widgets', getAccessibleWidgets);

export default router;
