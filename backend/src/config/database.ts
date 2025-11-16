import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  logger.info('[db] Connected to database');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('[db] Disconnected from database');
}
