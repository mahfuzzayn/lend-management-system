import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  sessionExpiresIn,
  sessionFromRequest,
  signSession,
} from "@/lib/auth";

/**
 * Route guard (requirements §11.3). Next.js 16 renamed middleware to Proxy;
 * it runs on the Node.js runtime by default, so jsonwebtoken verifies here.
 *
 * - /dashboard/:path*  without a valid session → redirect to /login?from=…
 * - /api/:path*        without a valid session → 401 JSON envelope
 *   (POST /api/auth/login is the only exempt route)
 * - Sliding refresh (§11.2): a valid session past half its TTL is re-issued
 *   on the response cookie, so active users never hit a login wall.
 */

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  const session = sessionFromRequest(request);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "You need to sign in to do that." },
        { status: 401 }
      );
    }
    const from = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/login?from=${from}`, request.url));
  }

  const response = NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const remaining = token ? sessionExpiresIn(token) : null;
  if (token && remaining !== null && remaining < SESSION_TTL_SECONDS / 2) {
    response.cookies.set(
      SESSION_COOKIE,
      signSession({ sub: session.sub, email: session.email, name: session.name }),
      sessionCookieOptions()
    );
  }
  return response;
}
