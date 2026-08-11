import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionWithUser } from "@/lib/auth"
import { hasPageAccess } from "@/lib/permissions"

export const runtime = 'nodejs'

// Azure AD App Role to local role mapping
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

/**
 * Decode JWT token (without verification - token is already verified by Azure AD)
 */
function decodeJWT(token: string): any {
  try {
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
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

/**
 * Sync Azure AD roles for Microsoft SSO users
 */
async function syncAzureRoles(userId: string): Promise<number | null> {
  try {
    const { prisma } = await import("./lib/prisma")

    // Get the Microsoft account for this user
    const account = await prisma.auth_accounts.findFirst({
      where: {
        userId: userId,
        providerId: "microsoft",
      },
    })

    if (!account || !account.idToken) {
      // Silent skip - most users don't have Microsoft OAuth configured
      return null
    }

    // Decode the idToken to get Azure AD roles
    const decodedToken = decodeJWT(account.idToken)
    if (!decodedToken) {
      console.log("Failed to decode idToken for user:", userId)
      return null
    }

    const azureRoles = decodedToken.roles as string[] || []
    if (azureRoles.length === 0) {
      console.log("No Azure AD roles found in token for user:", userId)
      return null
    }

    console.log("Azure AD roles for user", userId, ":", azureRoles)

    // Find the first matching Azure role in our mapping
    let matchedRoleId: number | null = null
    for (const azureRole of azureRoles) {
      // Try both the real mapping and test mapping
      if (AZURE_ROLE_MAPPING[azureRole]) {
        matchedRoleId = AZURE_ROLE_MAPPING[azureRole]
        break
      }
      if (TEST_ROLE_MAPPING[azureRole]) {
        matchedRoleId = TEST_ROLE_MAPPING[azureRole]
        break
      }
    }

    if (matchedRoleId) {
      // Update user's role in database
      await prisma.auth_users.update({
        where: { id: userId },
        data: { roleId: matchedRoleId }
      })
      console.log(`✅ Synced user ${userId} to role ID ${matchedRoleId} based on Azure AD role`)
    } else {
      console.log(`⚠️ No matching local role found for Azure AD roles:`, azureRoles)
    }

    return matchedRoleId
  } catch (error) {
    console.error("Error syncing Azure roles:", error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const session = await getSessionWithUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/access-denied"]
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Protected routes under (main) group
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/users") || 
      pathname.startsWith("/news") || pathname.startsWith("/notifications") ||
      pathname.startsWith("/larata-club-earning") || pathname.startsWith("/merchandise") ||
      pathname.startsWith("/redeem-merchandise") || pathname.startsWith("/daily-benefit") ||
      pathname.startsWith("/redeem-benefit") || pathname.startsWith("/master")) {
    
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Sync Azure AD roles for Microsoft SSO users on each session check
    let roleId = session.user?.roleId
    if (session?.user?.id) {
      const syncedRoleId = await syncAzureRoles(session.user.id)
      if (syncedRoleId !== null) {
        roleId = syncedRoleId
      }
    }

    // Check if user has a role assigned
    if (!roleId) {
      return NextResponse.redirect(new URL("/access-denied", request.url))
    }

    // Check if user has permission to access this page
    const hasAccess = await hasPageAccess(roleId, pathname)
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/access-denied", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
