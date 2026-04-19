import { PrismaClient } from '@prisma/client';

import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function shutdownDb() {
  await prisma.$disconnect();
}
