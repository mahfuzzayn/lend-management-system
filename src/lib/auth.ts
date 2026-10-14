import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AdminRole } from "@/types";
import { ApiError } from "./api-error";

/**
 * Session helpers (requirements §11.2). JWT (HS256, JWT_SECRET env) carried in
 * an httpOnly SameSite=Lax cookie, Secure in production.
 *
 * Pulled forward from G-59 because every Phase 13 handler needs the 401 path;
 * what stays in Phase 14 is the proxy guard, rate limiting, and the sliding
 * refresh (re-issuing the cookie when activity approaches the TTL).
 *
 * v1.4: the token also carries the admin's role (§1.4). Tokens/docs issued
 * before roles existed belong to the owner and resolve to "super-admin";
 * admins created from v1.4 on always carry an explicit role.
 */

export const SESSION_COOKIE = "lendbook-session";

/** 24h; proxy (G-60) will slide it forward on activity. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24;

export interface SessionPayload {
  /** Admin id (JWT standard claim for subject). */
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
}

export function sessionCookieOptions(maxAgeSeconds: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters (see .env.example).");
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret());
    if (typeof decoded === "string" || decoded === null) return null;
    const { sub, email, name, role } = decoded as Partial<SessionPayload>;
    if (typeof sub !== "string" || typeof email !== "string" || typeof name !== "string") {
      return null;
    }
    // Tokens issued before roles existed belong to the legacy owner, and
    // admin docs created from v1.4 on always carry an explicit role - so a
    // missing value resolves UP, never down (matches login/me).
    return { sub, email, name, role: role === "admin" ? "admin" : "super-admin" };
  } catch {
    return null;
  }
}

/**
 * Seconds until the token expires (decode only - call after verification).
 * Powers the proxy's sliding refresh (§11.2): re-issue once less than half
 * the TTL remains, so active sessions never see a login prompt.
 */
export function sessionExpiresIn(token: string): number | null {
  const decoded = jwt.decode(token);
  if (typeof decoded === "string" || decoded === null) return null;
  const { exp } = decoded as { exp?: unknown };
  if (typeof exp !== "number") return null;
  return exp - Math.floor(Date.now() / 1000);
}

export function sessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Throws the standard 401 ApiError unless a valid session cookie is present. */
export function requireSession(request: NextRequest): SessionPayload {
  const session = sessionFromRequest(request);
  if (!session) {
    throw new ApiError(401, "You need to sign in to do that.");
  }
  return session;
}

/**
 * Throws 403 unless the session belongs to a super admin (requirements
 * §11.7 - purge paths). The UI hiding the button is courtesy; this is the gate.
 */
export function requireSuperAdmin(request: NextRequest): SessionPayload {
  const session = requireSession(request);
  if (session.role !== "super-admin") {
    throw new ApiError(403, "Permanent deletes are limited to super admins.");
  }
  return session;
}

/** Session for server components (dashboard pages pass the role to Views). */
export async function sessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}
