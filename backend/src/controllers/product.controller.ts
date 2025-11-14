import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export const listProducts = asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(products);
});

export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = productSchema.parse(req.body);
  const product = await prisma.product.create({
    data: {
      name: payload.name,
      sku: payload.sku,
      categoryId: payload.categoryId ?? undefined,
      price: payload.price,
      stock: payload.stock,
      createdById: req.user?.id,
    },
  });
  res.status(StatusCodes.CREATED).json(product);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.productId },
    include: { category: true },
  });
  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found' });
  }
  res.json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.productId },
    data: {
      ...payload,
    },
  });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.productId } });
  res.status(StatusCodes.NO_CONTENT).send();
});
