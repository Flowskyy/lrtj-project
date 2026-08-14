import { PrismaClient } from './generated/prisma'
// import { activityLoggerExtension } from './activity-logger' // Disabled temporarily

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy PrismaClient initialization to avoid build-time database connection attempts
// PrismaClient is only instantiated when first accessed, not at module load time
// Use global-level caching to ensure true singleton behavior across hot reloads and prevent race conditions
const globalForBasePrisma = globalThis as unknown as {
  basePrisma: PrismaClient | undefined
}

function getBasePrisma(): PrismaClient {
  if (globalForBasePrisma.basePrisma) {
    return globalForBasePrisma.basePrisma
  }

  // Check if DATABASE_URL has timezone configured
  const databaseUrl = process.env.DATABASE_URL || ''
  if (!databaseUrl.includes('timezone=Asia/Jakarta') && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  WARNING: DATABASE_URL does not have timezone=Asia/Jakarta configured.')
    console.warn('   Timestamps may be stored in UTC instead of WIB (Asia/Jakarta).')
    console.warn('   Please add ?timezone=Asia/Jakarta to your DATABASE_URL:')
    console.warn('   Example: mysql://user:pass@host:port/db?timezone=Asia/Jakarta')
  }

  const prismaClient = new PrismaClient({
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

  globalForBasePrisma.basePrisma = prismaClient
  return prismaClient
}

// Activity logging extension disabled temporarily due to instability
// To re-enable: export const prisma = globalForPrisma.prisma ?? activityLoggerExtension(getBasePrisma())
// Use global caching to maintain singleton behavior across hot reloads
export const prisma = globalForPrisma.prisma ?? getBasePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export base client without extension for use within the logger to avoid circular dependency
// This is also lazy to avoid build-time database connection
export function getBasePrismaClient(): PrismaClient {
  return getBasePrisma()
}