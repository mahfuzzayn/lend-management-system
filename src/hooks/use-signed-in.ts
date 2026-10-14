"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api-client";

/**
 * True once /api/auth/me confirms a live session (works.md F10). Landing
 * pages stay statically rendered - this is a client-side enhancement, so an
 * anonymous first paint simply shows the sign-in CTA.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(() => {
        if (!cancelled) setSignedIn(true);
      })
      .catch(() => undefined); // 401 = anonymous, the default state
    return () => {
      cancelled = true;
    };
  }, []);

  return signedIn;
}
