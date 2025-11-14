import { Router } from 'express';
import {
  assignRole,
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  listWidgets,
  removeRole,
  updateRole,
  updateRolePermissions,
  updateRoleWidgets,
} from '../controllers/rbac.controller';
import { checkPermission, verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/roles', listRoles);
router.get('/permissions', listPermissions);
router.get('/widgets', listWidgets);

router.use(verifyToken, checkPermission('rbac.manage.roles'));

router.post('/roles', createRole);
router.patch('/roles/:roleId', updateRole);
router.delete('/roles/:roleId', deleteRole);
router.post('/user-roles', assignRole);
router.delete('/user-roles', removeRole);
router.patch('/roles/:roleId/permissions', updateRolePermissions);
router.patch('/roles/:roleId/widgets', updateRoleWidgets);

export default router;
