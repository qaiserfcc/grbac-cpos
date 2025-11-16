import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { auditLog } from '../utils/audit';

const roleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const roleUpdateSchema = z.object({
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const userRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const listRoles = asyncHandler(async (_req, res) => {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
    },
  });
  const result = roles.map((role: (typeof roles)[number]) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.rolePermissions.map(
      (rp: (typeof role.rolePermissions)[number]) => rp.permission.name,
    ),
  }));
  res.json(result);
});

export const createRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = roleSchema.parse(req.body);
  const existing = await prisma.role.findUnique({ where: { name: payload.name } });
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({ message: 'Role already exists' });
  }

  const role = await prisma.role.create({
    data: {
      name: payload.name,
      description: payload.description,
    },
  });

  if (payload.permissions?.length) {
    const permissions = await prisma.permission.findMany({
      where: { name: { in: payload.permissions } },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission: (typeof permissions)[number]) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
  }

  auditLog({
    action: 'role.created',
    userId: req.user?.id,
    details: { roleId: role.id, name: role.name, permissions: payload.permissions ?? [] },
  });

  res.status(StatusCodes.CREATED).json(role);
});

export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = roleUpdateSchema.parse(req.body);
  const role = await prisma.role.update({
    where: { id: req.params.roleId },
    data: { description: payload.description },
  });

  if (payload.permissions) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (payload.permissions.length) {
      const permissions = await prisma.permission.findMany({
        where: { name: { in: payload.permissions } },
      });
      await prisma.rolePermission.createMany({
        data: permissions.map((permission: (typeof permissions)[number]) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });
    }
  }

  auditLog({
    action: 'role.updated',
    userId: req.user?.id,
    details: { roleId: role.id, permissions: payload.permissions ?? null },
  });

  res.json(role);
});

export const deleteRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
  await prisma.role.delete({ where: { id: req.params.roleId } });
  auditLog({
    action: 'role.deleted',
    userId: req.user?.id,
    details: { roleId: req.params.roleId },
  });
  res.status(StatusCodes.NO_CONTENT).send();
});

export const listPermissions = asyncHandler(async (_req, res) => {
  const permissions = await prisma.permission.findMany();
  res.json(permissions);
});

export const assignRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = userRoleSchema.parse(req.body);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: payload.userId, roleId: payload.roleId } },
    update: {},
    create: payload,
  });
  auditLog({ action: 'user.role.assigned', userId: req.user?.id, details: payload });
  res.status(StatusCodes.CREATED).json({ message: 'Role assigned' });
});

export const removeRole = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = userRoleSchema.parse(req.body);
  await prisma.userRole.deleteMany({
    where: { userId: payload.userId, roleId: payload.roleId },
  });
  auditLog({ action: 'user.role.removed', userId: req.user?.id, details: payload });
  res.json({ message: 'Role removed' });
});

const rolePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

const roleWidgetsSchema = z.object({
  widgets: z.array(z.string()),
});

export const updateRolePermissions = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = rolePermissionsSchema.parse(req.body);
  const roleId = req.params.roleId;

  // Delete existing permissions
  await prisma.rolePermission.deleteMany({ where: { roleId } });

  // Add new permissions
  if (payload.permissions.length > 0) {
    const permissions = await prisma.permission.findMany({
      where: { name: { in: payload.permissions } },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission: (typeof permissions)[number]) => ({
        roleId,
        permissionId: permission.id,
      })),
    });
  }

  auditLog({
    action: 'role.permissions.updated',
    userId: req.user?.id,
    details: { roleId, permissions: payload.permissions },
  });

  res.json({ message: 'Role permissions updated' });
});

export const updateRoleWidgets = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = roleWidgetsSchema.parse(req.body);
  const roleId = req.params.roleId;

  // Delete existing widgets
  await prisma.roleWidget.deleteMany({ where: { roleId } });

  // Add new widgets
  if (payload.widgets.length > 0) {
    const widgets = await prisma.dashboardWidget.findMany({
      where: { widgetKey: { in: payload.widgets } },
    });
    await prisma.roleWidget.createMany({
      data: widgets.map((widget: (typeof widgets)[number]) => ({
        roleId,
        widgetId: widget.id,
      })),
    });
  }

  auditLog({
    action: 'role.widgets.updated',
    userId: req.user?.id,
    details: { roleId, widgets: payload.widgets },
  });

  res.json({ message: 'Role widgets updated' });
});

export const listWidgets = asyncHandler(async (_req, res) => {
  const widgets = await prisma.dashboardWidget.findMany();
  res.json(widgets);
});
