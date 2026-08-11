import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "../lib/prisma"
import { headers } from "next/headers"

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
    expiresIn: 60 * 10, // 10 minutes in seconds - absolute expiry from login
    updateAge: 0, // Disable rolling/idle expiry - session expires 10 minutes from login regardless of activity
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
  plugins: [nextCookies()],
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
