import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

declare global {
  var __arlPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

export const prisma: PrismaClient =
  globalThis.__arlPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__arlPrisma = prisma;
}

export type { PrismaClient };
