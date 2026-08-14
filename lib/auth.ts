import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "../lib/prisma"
import { headers } from "next/headers"
import { getWIBDate } from "../lib/utils"

export const auth = betterAuth({
  // Use dynamic baseURL to support multiple origins (localhost, LAN IPs)
  // This builds OAuth redirect URIs from the current request base URL
  // Azure Portal must have all possible redirect URIs registered
  baseURL: {
    allowedHosts: [
      "localhost",
      "100.89.130.113", // Tailscale LAN IP
      "172.16.12.230", // Wi-Fi LAN IP
    ],
    protocol: "http",
    fallback: "http://localhost:3000",
  },
  // Redirect Better Auth errors to custom access-denied page
  onAPIError: {
    errorURL: "/access-denied",
  },
  // Use database state storage for OAuth to avoid cross-origin cookie issues
  // This fixes state_mismatch errors when accessing via different origins (localhost vs LAN IPs)
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production", // HTTPS in production, HTTP in development
  },
  // Store OAuth state in database to avoid cross-origin cookie issues
  cookies: {
    storeStateStrategy: "database",
  },
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
        "user.permissions",
      ],
    },
  },
  account: {
    modelName: "auth_accounts",
    // Enable account linking for pre-provisioned users (Add Admin scenario)
    // Only trust Microsoft provider for automatic linking to avoid security risks
    accountLinking: {
      enabled: true,
      trustedProviders: ["microsoft"], // Only Microsoft is trusted for auto-linking
      // Security defaults: requireLocalEmailVerified: true (prevents takeover attacks)
      // disableImplicitLinking: false (allows automatic linking during sign-in)
    },
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
  // trustedOrigins for validation (complements dynamic baseURL)
  trustedOrigins: [
    "http://localhost:3000",
    "http://100.89.130.113:3000",
    "http://172.16.12.230:3000",
  ],
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        before: async (user: any) => {
          const now = getWIBDate()
          
          // BLOCK Microsoft OAuth user creation unless pre-provisioned
          // This must happen BEFORE any DB write to prevent partial data corruption
          // Note: Better Auth's account linking flow does NOT call user.create.before for existing users
          // It only calls account.create.before when linking to an existing user
          const email = user.email?.toLowerCase?.() || user.email
          if (email && email.endsWith('@lrtjakarta.co.id')) {
            // This is NEW user creation via Microsoft OAuth
            // BLOCK THIS: Microsoft OAuth users must be pre-provisioned via Add Admin
            throw new Error("Microsoft OAuth users must be pre-provisioned by an administrator. Please contact your IT department to request access.")
          }
          
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
          
          // Check if this is a Microsoft OAuth account creation
          if (account.providerId === 'microsoft') {
            const { prisma } = await import("./prisma")
            
            // Check if the user exists and has a roleId
            const user = await prisma.auth_users.findUnique({
              where: { id: account.userId },
              select: { roleId: true, email: true }
            })
            
            if (!user) {
              throw new Error("User not found for Microsoft account linking")
            }
            
            if (!user.roleId) {
              throw new Error("Microsoft OAuth users must be pre-provisioned with a role. Please contact your administrator to request access.")
            }
          }
          
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
