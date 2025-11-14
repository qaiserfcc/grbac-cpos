import { Router } from 'express';
import {
  assignRole,
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  removeRole,
  updateRole,
} from '../controllers/rbac.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/roles', listRoles);
router.get('/permissions', listPermissions);

router.use(verifyToken, checkPermission('rbac.manage.roles'));

router.post('/roles', createRole);
router.patch('/roles/:roleId', updateRole);
router.delete('/roles/:roleId', deleteRole);
router.post('/user-roles', assignRole);
router.delete('/user-roles', removeRole);

export default router;
