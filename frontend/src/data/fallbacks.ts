import type { Category, Product, Customer } from '@/types/rbac';

export const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Hardware', description: 'Terminals, scanners, in-lane devices' },
  { id: 'cat-2', name: 'Mobility', description: 'Tablets, handhelds, scan & go' },
  { id: 'cat-3', name: 'Back of House', description: 'Kitchen displays, prep tools' },
  { id: 'cat-4', name: 'Software', description: 'Subscriptions, analytics' },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prd-1',
    name: 'OmniPOS Terminal',
    sku: 'OPOS-001',
    price: 2499,
    stock: 12,
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Hardware' },
  },
  {
    id: 'prd-2',
    name: 'Scan & Go Tablet',
    sku: 'SNG-014',
    price: 899,
    stock: 34,
    categoryId: 'cat-2',
    category: { id: 'cat-2', name: 'Mobility' },
  },
  {
    id: 'prd-3',
    name: 'Kitchen Display Suite',
    sku: 'KDS-200',
    price: 1899,
    stock: 6,
    categoryId: 'cat-3',
    category: { id: 'cat-3', name: 'Back of House' },
  },
];

export const FALLBACK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    loyaltyTier: 'Gold',
    isVip: true,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-15T10:00:00Z',
  },
  {
    id: 'cust-2',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0456',
    loyaltyTier: 'Silver',
    isVip: false,
    createdAt: '2023-02-20T14:30:00Z',
    updatedAt: '2023-02-20T14:30:00Z',
  },
];
