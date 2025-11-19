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

describe('Customer routes', () => {
    const verifyAccessTokenMock = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

    beforeEach(() => {
        resetPrismaMock();
        jest.clearAllMocks();
    });

    const authHeader = { Authorization: 'Bearer test-token' };

    it('blocks access when permission is missing', async () => {
        verifyAccessTokenMock.mockReturnValue({
            sub: 'user-1',
            roles: ['Customer Admin'],
            permissions: ['customer.read'],
        });

        const response = await request(app)
            .post('/api/customers')
            .set(authHeader)
            .send({ fullName: 'John Doe' });

        expect(response.status).toBe(403);
        expect(prismaMock.customer.create).not.toHaveBeenCalled();
    });

    it('allows full CRUD when permissions are granted', async () => {
        verifyAccessTokenMock.mockReturnValue({
            sub: 'user-1',
            roles: ['Customer Admin'],
            permissions: ['customer.create', 'customer.read', 'customer.update', 'customer.delete'],
        });

        const createdCustomer = {
            id: 'cust-1',
            externalId: null,
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: null,
            loyaltyTier: null,
            isVip: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        prismaMock.customer.create.mockResolvedValue(createdCustomer);
        prismaMock.customer.findMany.mockResolvedValue([createdCustomer]);
        prismaMock.customer.findUnique.mockResolvedValue(createdCustomer);
        prismaMock.customer.update.mockResolvedValue({ ...createdCustomer, fullName: 'Jane Doe' });
        prismaMock.customer.delete.mockResolvedValue(createdCustomer);

        const createRes = await request(app)
            .post('/api/customers')
            .set(authHeader)
            .send({ fullName: 'John Doe', email: 'john@example.com' });
        expect(createRes.status).toBe(201);
        expect(createRes.body.fullName).toBe('John Doe');

        const listRes = await request(app).get('/api/customers').set(authHeader);
        expect(listRes.status).toBe(200);
        expect(listRes.body).toHaveLength(1);

        const detailRes = await request(app).get(`/api/customers/${createdCustomer.id}`).set(authHeader);
        expect(detailRes.status).toBe(200);
        expect(detailRes.body.id).toBe(createdCustomer.id);

        const updateRes = await request(app)
            .put(`/api/customers/${createdCustomer.id}`)
            .set(authHeader)
            .send({ fullName: 'Jane Doe' });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.fullName).toBe('Jane Doe');

        const deleteRes = await request(app)
            .delete(`/api/customers/${createdCustomer.id}`)
            .set(authHeader);
        expect(deleteRes.status).toBe(204);
    });

    it('returns customer purchase history', async () => {
        verifyAccessTokenMock.mockReturnValue({
            sub: 'user-1',
            roles: ['Customer Admin'],
            permissions: ['customer.read'],
        });

        const customerId = 'cust-1';
        const mockSales = [
            {
                id: 'sale-1',
                customerId,
                total: 100,
                createdAt: new Date(),
                items: [
                    {
                        id: 'item-1',
                        productId: 'prod-1',
                        quantity: 2,
                        price: 50,
                        product: { id: 'prod-1', name: 'Product 1' },
                    },
                ],
            },
        ];

        prismaMock.sale.findMany.mockResolvedValue(mockSales);

        const response = await request(app)
            .get(`/api/customers/${customerId}/history`)
            .set(authHeader);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe('sale-1');
    });
});
