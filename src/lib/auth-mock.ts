"use client";

import { useSyncExternalStore } from "react";

import { DEMO_CREDENTIAL, MOCK_SESSION_KEY } from "@/lib/config";

/**
 * v1 mock authentication (requirements §3.1): a client-side session flag in
 * localStorage checked against the fixed demo credential. No real security -
 * replaced by JWT + httpOnly cookie auth in v2.
 *
 * Note: the session hook listens for cross-tab `storage` events; same-tab
 * changes (login/logout) are picked up on the next navigation/mount, which is
 * all the v1 flows need.
 */

export function isMockAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MOCK_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export async function mockLogin(
  email: string,
  password: string
): Promise<{ ok: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600)); // simulate a round-trip
  const ok =
    email.trim().toLowerCase() === DEMO_CREDENTIAL.email &&
    password === DEMO_CREDENTIAL.password;
  if (ok) {
    try {
      window.localStorage.setItem(MOCK_SESSION_KEY, "1");
    } catch {
      // storage unavailable - session stays unset, treated as guest
    }
  }
  return { ok };
}

export function mockLogout() {
  try {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // nothing to clean up
  }
}

function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSessionSnapshot(): string | null {
  try {
    return window.localStorage.getItem(MOCK_SESSION_KEY);
  } catch {
    return null;
  }
}

function getServerSessionSnapshot(): undefined {
  return undefined;
}

/**
 * Session state with a first-paint "checking" phase (server/hydration
 * snapshot) to avoid redirect flashes before the real value is known.
 */
export function useMockSession(): "checking" | "authed" | "guest" {
  const snapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  if (snapshot === "1") return "authed";
  if (snapshot === null) return "guest";
  return "checking";
}
