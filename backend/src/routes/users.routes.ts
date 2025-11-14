import { Router } from 'express';
import {
  getUser,
  listUsers,
  updateUserRoles,
  updateUserStatus,
} from '../controllers/users.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', checkPermission('rbac.manage.users'), listUsers);
router.get('/:userId', checkPermission('rbac.manage.users'), getUser);
router.patch('/:userId/roles', checkPermission('rbac.manage.users'), updateUserRoles);
router.patch('/:userId/status', checkPermission('rbac.manage.users'), updateUserStatus);

export default router;