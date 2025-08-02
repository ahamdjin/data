import { PrismaClient } from '@prisma/client'

/**
 * Singleton Prisma client
 *
 * In development we store the Prisma client on `globalThis` to ensure that
 * hot reloads reuse the same instance and do not create new database
 * connections. In production a new client is created per invocation.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
