import { prisma } from '../config/database';
import { Customer, Sale } from '@prisma/client';

export interface CustomerInput {
    externalId?: string;
    fullName: string;
    email?: string;
    phone?: string;
    loyaltyTier?: string;
    isVip?: boolean;
}

export interface CustomerWithSales extends Customer {
    sales: Sale[];
}

export async function createCustomer(data: CustomerInput): Promise<Customer> {
    return prisma.customer.create({
        data,
    });
}

export async function getCustomers(): Promise<Customer[]> {
    return prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
        where: { id },
    });
}

export async function updateCustomer(id: string, data: Partial<CustomerInput>): Promise<Customer> {
    return prisma.customer.update({
        where: { id },
        data,
    });
}

export async function deleteCustomer(id: string): Promise<Customer> {
    return prisma.customer.delete({
        where: { id },
    });
}

export async function getCustomerPurchaseHistory(customerId: string): Promise<Sale[]> {
    return prisma.sale.findMany({
        where: { customerId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
