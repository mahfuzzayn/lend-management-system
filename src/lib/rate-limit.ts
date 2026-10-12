import type { NextRequest } from "next/server";

/**
 * In-memory login rate limiter (requirements §11.5):
 * at most 5 FAILED attempts per 10 minutes per IP, then every attempt
 * (correct password included) is rejected until the window rolls over.
 *
 * In-memory means per-instance: on serverless platforms several instances
 * share the traffic, so this blunts brute force rather than eliminating it.
 * Documented in the README; a shared store would need a new dependency.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;

type Bucket = { failures: number; windowStart: number };

const globalForRateLimit = globalThis as unknown as {
  __loginRateLimit?: Map<string, Bucket>;
};
const buckets = globalForRateLimit.__loginRateLimit ?? new Map<string, Bucket>();
globalForRateLimit.__loginRateLimit = buckets;

function prune(now: number): void {
  if (buckets.size < 1000) return;
  for (const [ip, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(ip);
  }
}

/** Best-effort client IP: first hop of x-forwarded-for, else x-real-ip. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0];
  if (first) return first.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function isLoginBlocked(ip: string): boolean {
  const bucket = buckets.get(ip);
  if (!bucket) return false;
  if (Date.now() - bucket.windowStart > WINDOW_MS) {
    buckets.delete(ip);
    return false;
  }
  return bucket.failures >= MAX_FAILURES;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { failures: 1, windowStart: now });
    return;
  }
  bucket.failures += 1;
}

/** Successful sign-in clears the slate for that IP. */
export function resetLoginFailures(ip: string): void {
  buckets.delete(ip);
}
