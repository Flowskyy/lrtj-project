import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithUser, auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser();

    if (!session?.user?.id) {
      return NextResponse.json({ redirect: '/login' });
    }

    // If user now has a role (approved), force better-auth to re-fetch the
    // session from DB (bypassing the stale 24h JWT cookie cache) so the new
    // roleId is written into the cookie. This makes the role immediately
    // available app-wide (middleware, client, other pages) without re-login.
    if (session.user.roleId) {
      let response = NextResponse.json({ redirect: '/dashboard' });

      try {
        const { headers: refreshHeaders } = (await auth.api.getSession({
          headers: request.headers,
          query: { disableCookieCache: 'true' },
          returnHeaders: true,
          returnStatus: false,
        })) as any;

        const setCookie = refreshHeaders?.get?.('set-cookie');
        if (setCookie) {
          response.headers.set('set-cookie', setCookie);
        }
      } catch {
        // If refresh fails, proceed without cookie rewrite.
        // Middleware DB fallback will still allow access via the fresh DB roleId.
      }

      return response;
    }

    // User is authenticated but has no role - show waiting page
    return NextResponse.json({
      redirect: null,
      email: session.user.email || null,
      name: session.user.name || null,
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json({ redirect: '/login' });
  }
}
