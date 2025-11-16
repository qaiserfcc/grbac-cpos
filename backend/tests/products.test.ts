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
import { verifyAccessToken } from '../src/utils/token';

describe('Product routes', () => {
  const verifyAccessTokenMock = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  const authHeader = { Authorization: 'Bearer test-token' };

  it('blocks access when permission is missing', async () => {
    verifyAccessTokenMock.mockReturnValue({
      sub: 'user-1',
      roles: ['Product Admin'],
      permissions: ['product.read'],
    });

    const response = await request(app)
      .post('/api/products')
      .set(authHeader)
      .send({ name: 'Test Product', price: 10, stock: 5 });

    expect(response.status).toBe(403);
    expect(prismaMock.product.create).not.toHaveBeenCalled();
  });

  it('allows full CRUD when permissions are granted', async () => {
    verifyAccessTokenMock.mockReturnValue({
      sub: 'user-1',
      roles: ['Product Admin'],
      permissions: ['product.create', 'product.read', 'product.update', 'product.delete'],
    });

    const createdProduct = {
      id: 'prod-1',
      name: 'Test Product',
      sku: 'SKU-1',
      price: 10,
      stock: 5,
      categoryId: null,
    };

    prismaMock.product.create.mockResolvedValue(createdProduct);
    prismaMock.product.findMany.mockResolvedValue([createdProduct]);
    prismaMock.product.findUnique.mockResolvedValue(createdProduct);
    prismaMock.product.update.mockResolvedValue({ ...createdProduct, name: 'Updated Product' });
    prismaMock.product.delete.mockResolvedValue(createdProduct);

    const createRes = await request(app)
      .post('/api/products')
      .set(authHeader)
      .send({ name: 'Test Product', price: 10, stock: 5 });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Test Product');

    const listRes = await request(app).get('/api/products').set(authHeader);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const detailRes = await request(app).get(`/api/products/${createdProduct.id}`).set(authHeader);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.id).toBe(createdProduct.id);

    const updateRes = await request(app)
      .patch(`/api/products/${createdProduct.id}`)
      .set(authHeader)
      .send({ name: 'Updated Product' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Updated Product');

    const deleteRes = await request(app)
      .delete(`/api/products/${createdProduct.id}`)
      .set(authHeader);
    expect(deleteRes.status).toBe(204);
  });
});
