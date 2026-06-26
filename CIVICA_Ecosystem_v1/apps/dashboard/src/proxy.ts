import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@civica/auth';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Coarse, cookie-presence-only gate. This does not validate the session —
 * that authoritative check happens in dashboard/layout.tsx and the per-tool
 * placeholder pages via getCurrentUser(). This proxy only avoids serving
 * protected pages to requests with no session cookie at all.
 *
 * Every route is protected by default except PUBLIC_PATHS and the paths
 * excluded by the matcher below (Next internals, static assets, and API
 * routes). New tool routes under src/app/(tools)/* are protected
 * automatically without needing to be listed here.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  if (!hasSessionCookie) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals, API routes, the public auth pages, and any
  // request for a static file (path segment containing a dot, e.g.
  // /CIVICA_logo_transparent.png) so public assets load on /login and
  // /register without a session cookie.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|login|register|.*\\..*).*)'],
};
