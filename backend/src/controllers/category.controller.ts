import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const payload = categorySchema.parse(req.body);
  const category = await prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description,
      createdById: req.user?.id,
    },
  });
  res.status(StatusCodes.CREATED).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const payload = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.categoryId },
    data: payload,
  });
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.categoryId } });
  res.status(StatusCodes.NO_CONTENT).send();
});
