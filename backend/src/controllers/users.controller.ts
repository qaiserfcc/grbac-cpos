import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { auditLog } from '../utils/audit';
import { getUserContext } from '../services/access-control.service';

const updateUserRolesSchema = z.object({
  roles: z.array(z.string().uuid()),
});

const updateUserStatusSchema = z.object({
  isEnabled: z.boolean(),
});

const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(1),
  password: z.string().min(6).optional(),
});

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = createUserSchema.parse(req.body);

  // Use provided password or default
  const rawPassword = payload.password ?? 'Passw0rd!';

  // Lazy import to avoid unnecessary cost if unused elsewhere
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      username: payload.username,
      email: payload.email,
      fullName: payload.fullName,
      passwordHash,
      isEnabled: true,
    },
  });

  auditLog({
    action: 'user.created',
    userId: req.user?.id,
    details: { targetUserId: user.id, username: user.username, email: user.email },
  });

  res.status(StatusCodes.CREATED).json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = users.map((user: (typeof users)[0]) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
    roles: user.roles.map((ur: (typeof user.roles)[0]) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    })),
  }));

  res.json(result);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
  }

  const context = await getUserContext(user.id);
  const result = {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    isEnabled: user.isEnabled,
    createdAt: user.createdAt,
    roles: user.roles.map((ur: (typeof user.roles)[0]) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    })),
    permissions: context.permissions,
  };

  res.json(result);
});

export const updateUserRoles = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = updateUserRolesSchema.parse(req.body);
  const userId = req.params.userId;

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
  }

  // Verify all roles exist
  const roles = await prisma.role.findMany({ where: { id: { in: payload.roles } } });
  if (roles.length !== payload.roles.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'One or more roles are invalid' });
  }

  // Remove existing roles and add new ones
  await prisma.userRole.deleteMany({ where: { userId } });
  if (payload.roles.length > 0) {
    await prisma.userRole.createMany({
      data: payload.roles.map((roleId) => ({
        userId,
        roleId,
        assignedBy: req.user?.id,
      })),
    });
  }

  auditLog({
    action: 'user.roles.updated',
    userId: req.user?.id,
    details: { targetUserId: userId, roles: payload.roles },
  });

  const context = await getUserContext(userId);
  res.json({
    message: 'User roles updated successfully',
    roles: context.roles,
    permissions: context.permissions,
  });
});

export const updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = updateUserStatusSchema.parse(req.body);
  const userId = req.params.userId;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isEnabled: payload.isEnabled },
  });

  auditLog({
    action: 'user.status.updated',
    userId: req.user?.id,
    details: { targetUserId: userId, isEnabled: payload.isEnabled },
  });

  res.json({
    message: `User ${payload.isEnabled ? 'enabled' : 'disabled'} successfully`,
    isEnabled: user.isEnabled,
  });
});
