import { PrismaClient } from './generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Increase connection pool to prevent exhaustion during long-running exports
  // Current connection_limit=5 is too small for concurrent export + normal browsing
  // Setting to 20 to allow headroom for concurrent operations
  // This is a conservative increase - most MySQL servers allow 100+ connections
  // Note: MySQL connection pool settings should be configured in DATABASE_URL:
  // mysql://user:pass@host:port/db?connection_limit=20&pool_timeout=10
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma