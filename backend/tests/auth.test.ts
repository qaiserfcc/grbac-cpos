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
import { signAccessToken, signRefreshToken } from '../src/utils/token';

describe('Auth routes', () => {
  const getUserContextMock = getUserContext as jest.MockedFunction<typeof getUserContext>;
  const signAccessTokenMock = signAccessToken as jest.MockedFunction<typeof signAccessToken>;
  const signRefreshTokenMock = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;

  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
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
      permissions: ['product.read']
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
});
