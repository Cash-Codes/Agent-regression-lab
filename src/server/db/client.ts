import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

declare global {
  var __arlPrisma: PrismaClient | undefined;
}

function buildPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const adapter = new PrismaPg({ connectionString, max: 4 });
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (globalThis.__arlPrisma) return globalThis.__arlPrisma;
  if (_prisma) return _prisma;
  _prisma = buildPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__arlPrisma = _prisma;
  }
  return _prisma;
}

// Lazy proxy: forwards every access to the singleton, constructing it on
// first use. Importing this module has no side effects, so tests and tools
// that don't need a DB connection can import server code freely.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
}) as PrismaClient;

export type { PrismaClient };
