import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionOptimistic } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie")
  const session = await getSessionOptimistic(cookieHeader)

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

    // Check if user has a role assigned
    const userId = session.user?.id
    const cachedRoleId = session.user?.roleId

    if (!cachedRoleId && userId) {
      // JWT cookie cache may be stale (24h cache) - fall back to DB for users whose
      // cached roleId is null. This lets a just-approved SSO user in without re-login.
      // Only this branch hits the DB; normal users keep the fast cached path.
      try {
        const dbUser = await prisma.auth_users.findUnique({
          where: { id: userId },
          select: { roleId: true },
        })
        if (dbUser?.roleId) {
          return NextResponse.next()
        }
      } catch (error) {
        console.error("Middleware DB role check failed:", error)
      }
      return NextResponse.redirect(new URL("/access-denied", request.url))
    }

    // Note: Detailed permission checking moved to page level to avoid DB calls in middleware
    // Pages should use hasPageAccess() to check specific permissions
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
