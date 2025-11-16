import { jest } from '@jest/globals';
import request from 'supertest';
import { prismaMock, resetPrismaMock } from './utils/prismaMock';

jest.mock('../src/config/database', () => ({
  prisma: prismaMock,
}));

jest.mock('../src/services/access-control.service', () => ({
  getUserContext: jest.fn(),
}));

jest.mock('../src/utils/token', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

import { app } from '../src/app';
import { hashPassword } from '../src/utils/password';
import { getUserContext } from '../src/services/access-control.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/token';

describe('Auth routes', () => {
  const getUserContextMock = getUserContext as jest.MockedFunction<typeof getUserContext>;
  const signAccessTokenMock = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
  const signRefreshTokenMock = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;
  const verifyRefreshTokenMock = verifyRefreshToken as jest.MockedFunction<
    typeof verifyRefreshToken
  >;

  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  it('rejects login when payload validation fails', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'ab', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('logs in a user and returns tokens', async () => {
    const passwordHash = await hashPassword('Passw0rd!');
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      username: 'admin',
      email: 'admin@cpos.local',
      passwordHash,
      isEnabled: true,
      fullName: 'Admin User',
    });
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' });
    getUserContextMock.mockResolvedValue({
      roles: [{ id: 'role-1', name: 'Super Admin', description: 'Full access' }],
      permissions: ['product.read'],
    });
    signAccessTokenMock.mockReturnValue('access-token');
    signRefreshTokenMock.mockReturnValue('refresh-token');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@cpos.local', password: 'Passw0rd!' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        email: 'admin@cpos.local',
        roles: [{ id: 'role-1', name: 'Super Admin', description: 'Full access' }],
        permissions: ['product.read'],
      },
    });
    expect(prismaMock.session.create).toHaveBeenCalledTimes(1);
  });

  it('registers a user with roles and returns context', async () => {
    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.role.findMany.mockResolvedValue([
      {
        id: 'role-1',
        name: 'Store Manager',
        description: 'Manages store ops',
        createdAt: new Date(),
      },
    ]);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-2',
      username: 'storemgr',
      email: 'store@cpos.local',
      passwordHash: 'hashed',
      fullName: 'Store Manager',
      isEnabled: true,
    });
    prismaMock.userRole.createMany.mockResolvedValue({ count: 1 });
    getUserContextMock.mockResolvedValue({
      roles: [{ id: 'role-1', name: 'Store Manager', description: 'Manages store ops' }],
      permissions: ['inventory.read'],
    });

    const payload = {
      username: 'storemgr',
      email: 'STORE@CPOS.LOCAL',
      password: 'Passw0rd!',
      fullName: 'Store Manager',
      roles: ['Store Manager'],
    };

    const response = await request(app).post('/api/auth/register').send(payload);

    expect(response.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.userRole.createMany).toHaveBeenCalledTimes(1);
    expect(getUserContextMock).toHaveBeenCalledWith('user-2');
    expect(response.body.user).toMatchObject({
      username: 'storemgr',
      email: 'store@cpos.local',
      roles: [{ id: 'role-1', name: 'Store Manager', description: 'Manages store ops' }],
      permissions: ['inventory.read'],
    });
  });

  it('rejects registration when user already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'existing',
        email: 'existing@cpos.local',
        password: 'Passw0rd!',
        fullName: 'Existing User',
        roles: ['Store Manager'],
      });

    expect(response.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('refreshes tokens for a valid session', async () => {
    verifyRefreshTokenMock.mockReturnValue({
      sub: 'user-1',
      roles: ['Store Manager'],
      permissions: ['inventory.read'],
      sessionId: 'session-1',
    });
    const refreshToken = 'refresh-token-1234567890';
    const hashedToken = await hashPassword(refreshToken);
    prismaMock.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    prismaMock.session.update.mockResolvedValue({ id: 'session-1' });
    signAccessTokenMock.mockReturnValue('new-access-token');
    signRefreshTokenMock.mockReturnValue('new-refresh-token');

    const response = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(prismaMock.session.update).toHaveBeenCalledTimes(1);
  });

  it('rejects refresh when session is missing', async () => {
    verifyRefreshTokenMock.mockReturnValue({
      sub: 'user-1',
      roles: [],
      permissions: [],
      sessionId: 'missing-session',
    });
    prismaMock.session.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'stale-token-1234567890' });

    expect(response.status).toBe(401);
    expect(prismaMock.session.update).not.toHaveBeenCalled();
  });

  it('logs out a user by deleting sessions', async () => {
    verifyRefreshTokenMock.mockReturnValue({
      sub: 'user-1',
      roles: [],
      permissions: [],
      sessionId: 'session-9',
    });
    prismaMock.session.deleteMany.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'logout-refresh-token-1234567890' });

    expect(response.status).toBe(200);
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({
      where: { id: 'session-9', userId: 'user-1' },
    });
  });
});
