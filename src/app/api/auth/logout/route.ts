import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { apiSuccess, withApi } from "@/lib/api";
import { SESSION_COOKIE, requireSession } from "@/lib/auth";

/** POST /api/auth/logout - clears the session cookie (requires a session). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    (await cookies()).delete(SESSION_COOKIE);
    return apiSuccess({ loggedOut: true });
  });
}
