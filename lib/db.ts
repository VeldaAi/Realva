import { PrismaClient, Prisma } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Cast helper for Prisma JSON fields.
 * Prisma's InputJsonValue requires string-indexed objects, but our typed
 * domain objects (Comp[], typed response shapes, etc.) are valid JSON at
 * runtime yet fail the structural type check. This helper narrows the
 * escape hatch to one place instead of sprinkling `as any` across callers.
 */
export function json<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
