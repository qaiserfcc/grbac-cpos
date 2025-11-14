import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import ms from 'ms';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { asyncHandler } from '../middleware/asyncHandler';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token';
import { getUserContext } from '../services/access-control.service';

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  roles: z.array(z.string()).nonempty(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

function sanitizeUser(user: { id: string; username: string; email: string; fullName: string | null }) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
  };
}

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
    },
  });

  if (!user || !user.isEnabled) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }

  const context = await getUserContext(user.id);
  const accessToken = signAccessToken({ 
    sub: user.id, 
    roles: context.roles.map(r => r.name), 
    permissions: context.permissions 
  });
  const sessionId = randomUUID();
  const refreshToken = signRefreshToken({ 
    sub: user.id, 
    roles: context.roles.map(r => r.name), 
    permissions: context.permissions, 
    sessionId 
  });
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      token: await bcrypt.hash(refreshToken, 12),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + ms(env.refreshTokenTtl)),
    },
  });

  return res.json({
    accessToken,
    refreshToken,
    user: { ...sanitizeUser(user), roles: context.roles, permissions: context.permissions },
  });
});

export const register = asyncHandler(async (req: Request, res) => {
  const payload = registerSchema.parse(req.body);
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email.toLowerCase() }, { username: payload.username }],
    },
  });
  if (existingUser) {
    return res.status(StatusCodes.CONFLICT).json({ message: 'User already exists' });
  }

  const roles = await prisma.role.findMany({ where: { name: { in: payload.roles } } });
  if (roles.length !== payload.roles.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'One or more roles are invalid' });
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      username: payload.username,
      email: payload.email.toLowerCase(),
      passwordHash,
      fullName: payload.fullName,
    },
  });

  await prisma.userRole.createMany({
    data: roles.map((role: (typeof roles)[number]) => ({
      userId: user.id,
      roleId: role.id,
      assignedBy: null,
    })),
  });

  const context = await getUserContext(user.id);
  return res.status(StatusCodes.CREATED).json({
    user: { ...sanitizeUser(user), roles: context.roles, permissions: context.permissions },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyRefreshToken(refreshToken);
  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.userId !== payload.sub) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid session' });
  }

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Session expired' });
  }

  const tokenMatches = await bcrypt.compare(refreshToken, session.token);
  if (!tokenMatches) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' });
  }

  const context = await getUserContext(payload.sub);
  const accessToken = signAccessToken({ 
    sub: payload.sub, 
    roles: context.roles.map(r => r.name), 
    permissions: context.permissions 
  });
  const newRefreshToken = signRefreshToken({ 
    sub: payload.sub, 
    roles: context.roles.map(r => r.name), 
    permissions: context.permissions, 
    sessionId: session.id 
  });
  await prisma.session.update({
    where: { id: session.id },
    data: {
      token: await bcrypt.hash(newRefreshToken, 12),
      expiresAt: new Date(Date.now() + ms(env.refreshTokenTtl)),
    },
  });

  return res.json({ accessToken, refreshToken: newRefreshToken });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyRefreshToken(refreshToken);
  await prisma.session.deleteMany({ where: { id: payload.sessionId, userId: payload.sub } });
  return res.json({ message: 'Logged out' });
});
