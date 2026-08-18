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

let _basePrismaInstance: PrismaClient | null = null

function getBasePrisma(): PrismaClient {
  if (_basePrismaInstance) {
    return _basePrismaInstance
  }

  if (globalForBasePrisma.basePrisma) {
    _basePrismaInstance = globalForBasePrisma.basePrisma
    return _basePrismaInstance
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

  _basePrismaInstance = prismaClient
  globalForBasePrisma.basePrisma = prismaClient
  return prismaClient
}

// Activity logging extension disabled temporarily due to instability
// To re-enable: export const prisma = globalForPrisma.prisma ?? activityLoggerExtension(getBasePrisma())
// Use global caching to maintain singleton behavior across hot reloads

// Genuine lazy initialization using Proxy
// The PrismaClient is only constructed when the first property is accessed
// This prevents the constructor from running at module import time (which breaks Docker builds)
let _prismaInstance: PrismaClient | null = null

const prismaProxyHandler: ProxyHandler<PrismaClient> = {
  get(_target, prop) {
    if (!_prismaInstance) {
      _prismaInstance = getBasePrisma()
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = _prismaInstance
      }
    }
    const value = _prismaInstance[prop as keyof PrismaClient]
    // Bind methods to the instance to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(_prismaInstance)
    }
    return value
  },
}

export const prisma = new Proxy({} as PrismaClient, prismaProxyHandler)

// Export base client without extension for use within the logger to avoid circular dependency
// This is also lazy to avoid build-time database connection
export function getBasePrismaClient(): PrismaClient {
  return getBasePrisma()
}