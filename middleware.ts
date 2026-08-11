import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionOptimistic } from "@/lib/auth"

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
    const roleId = session.user?.roleId
    if (!roleId) {
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
