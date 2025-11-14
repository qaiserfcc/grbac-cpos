import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
  console.info('[db] Connected to database');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.info('[db] Disconnected from database');
}
