import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "../lib/prisma"
import { headers } from "next/headers"
import { getWIBDate } from "../lib/utils"

// Azure AD App Role to local role mapping
// TODO: Confirm actual Azure App Role names with Azure AD admin
const AZURE_ROLE_MAPPING: Record<string, number> = {
  // Example mapping (update with actual Azure App Role names):
  // "CMS.SuperAdmin": 1,      // SUPER_ADMIN
  // "CMS.Operations": 2,      // OPERATIONS  
  // "CMS.Viewer": 3,          // VIEWER
  // "CMS.SecurityAdmin": 4,   // SECURITY_ADMIN
}

// For testing purposes - temporary placeholder mapping
const TEST_ROLE_MAPPING: Record<string, number> = {
  "test_role": 1,  // Maps to SUPER_ADMIN for testing
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  user: {
    modelName: "auth_users",
    additionalFields: {
      roleId: {
        type: "number",
        required: false,
      },
    },
  },
  session: {
    modelName: "auth_sessions",
    expiresIn: 60 * 60 * 24, // 24 hours - absolute expiry from login
    updateAge: 0, // Disable rolling/idle expiry - session expires 24 hours from login regardless of activity
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 1 day
      strategy: "jwt",
      include: [
        "user.id",
        "user.name",
        "user.email",
        "user.emailVerified",
        "user.image",
        "user.createdAt",
        "user.updatedAt",
        "user.roleId",
      ],
    },
  },
  account: {
    modelName: "auth_accounts",
  },
  verification: {
    modelName: "auth_verifications",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
      enabled: true,
    },
  },
  // Configure trusted origins to handle both localhost and LAN access
  // This fixes INVALID_ORIGIN errors when accessing via LAN IP instead of localhost
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://172.16.12.230:3000", // LAN IP from dev-with-lan.js - add your LAN IP here if different
  ],
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        before: async (user: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...user,
              createdAt: now,
              updatedAt: now,
            }
          }
        }
      },
      update: {
        before: async (user: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...user,
              updatedAt: now,
            }
          }
        }
      }
    },
    session: {
      create: {
        before: async (session: any) => {
          const now = getWIBDate()

          // Fetch user permissions to include in session
          let permissions: string[] = []
          if (session.userId) {
            const { getUserPermissions } = await import("./permissions")
            const user = await prisma.auth_users.findUnique({
              where: { id: session.userId },
              select: { roleId: true }
            })
            if (user?.roleId) {
              permissions = await getUserPermissions(user.roleId)
            }
          }

          return {
            data: {
              ...session,
              createdAt: now,
              updatedAt: now,
              user: {
                ...session.user,
                permissions,
              },
            }
          }
        }
      },
      update: {
        before: async (session: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...session,
              updatedAt: now,
            }
          }
        }
      }
    },
    account: {
      create: {
        before: async (account: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...account,
              createdAt: now,
              updatedAt: now,
            }
          }
        }
      },
      update: {
        before: async (account: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...account,
              updatedAt: now,
            }
          }
        }
      }
    },
    verification: {
      create: {
        before: async (verification: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...verification,
              createdAt: now,
              updatedAt: now,
            }
          }
        }
      },
      update: {
        before: async (verification: any) => {
          const now = getWIBDate()
          return {
            data: {
              ...verification,
              updatedAt: now,
            }
          }
        }
      }
    }
  }
})

// Helper function for server-side session retrieval
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}

// Helper function for server-side session retrieval with user data
export async function getSessionWithUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return null
  }

  // Fetch user with role from database
  const user = await prisma.auth_users.findUnique({
    where: { id: session.user.id },
    select: { roleId: true }
  })

  return {
    ...session,
    user: {
      ...session.user,
      roleId: user?.roleId,
    },
  }
}

// Helper function for optimistic session validation in middleware (no DB call)
// This reads the JWT cookie and returns session data if present and valid
// For production use, consider using jose library for proper JWT verification
export async function getSessionOptimistic(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null
  }

  const cookieName = "better-auth.session_data"

  // Parse cookies to find the session_data cookie
  const cookiesArray = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookiesArray.find(c => c.startsWith(`${cookieName}=`))

  if (!sessionCookie) {
    return null
  }

  try {
    // Extract the JWT token
    const token = sessionCookie.split('=')[1]
    if (!token) {
      return null
    }

    // Decode the JWT (without verification for optimistic check)
    // In production, you should verify the signature using jose library
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
    const payload = JSON.parse(jsonPayload)

    // Return session data from JWT payload
    return {
      user: payload.user,
      session: payload.session,
    }
  } catch (error) {
    console.error("Error decoding session JWT:", error)
    return null
  }
}
