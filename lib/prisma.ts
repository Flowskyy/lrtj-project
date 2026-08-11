import { PrismaClient } from './generated/prisma'
// import { activityLoggerExtension } from './activity-logger' // Disabled temporarily

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL has timezone configured
const databaseUrl = process.env.DATABASE_URL || ''
if (!databaseUrl.includes('timezone=Asia/Jakarta') && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  WARNING: DATABASE_URL does not have timezone=Asia/Jakarta configured.')
  console.warn('   Timestamps may be stored in UTC instead of WIB (Asia/Jakarta).')
  console.warn('   Please add ?timezone=Asia/Jakarta to your DATABASE_URL:')
  console.warn('   Example: mysql://user:pass@host:port/db?timezone=Asia/Jakarta')
}

const basePrisma = new PrismaClient({
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

// Activity logging extension disabled temporarily due to instability
// To re-enable: export const prisma = globalForPrisma.prisma ?? activityLoggerExtension(basePrisma)
export const prisma = globalForPrisma.prisma ?? basePrisma

// Export base client without extension for use within the logger to avoid circular dependency
export const basePrismaClient = basePrisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma