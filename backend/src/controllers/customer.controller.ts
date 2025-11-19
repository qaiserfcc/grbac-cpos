import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerPurchaseHistory,
    CustomerInput,
} from '../services/customer.service';

const customerSchema = z.object({
    externalId: z.string().optional(),
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    loyaltyTier: z.string().optional(),
    isVip: z.boolean().optional(),
});

export const listCustomers = asyncHandler(async (_req, res) => {
    const customers = await getCustomers();
    res.json(customers);
});

export const getCustomer = asyncHandler(async (req, res) => {
    const customer = await getCustomerById(req.params.customerId);
    if (!customer) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Customer not found' });
    }
    res.json(customer);
});

export const createCustomerHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = customerSchema.parse(req.body) as CustomerInput;
    const customer = await createCustomer(payload);
    res.status(StatusCodes.CREATED).json(customer);
});

export const updateCustomerHandler = asyncHandler(async (req, res) => {
    const payload = customerSchema.partial().parse(req.body);
    const customer = await updateCustomer(req.params.customerId, payload);
    res.json(customer);
});

export const deleteCustomerHandler = asyncHandler(async (req, res) => {
    await deleteCustomer(req.params.customerId);
    res.status(StatusCodes.NO_CONTENT).send();
});

export const getCustomerHistory = asyncHandler(async (req, res) => {
    const history = await getCustomerPurchaseHistory(req.params.customerId);
    res.json(history);
});
