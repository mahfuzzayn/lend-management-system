import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "./api-error";

/**
 * API plumbing (requirements §6): every response uses one envelope -
 * `{ success: true, data }` or `{ success: false, message }` - and every
 * handler runs through `withApi` so statuses stay consistent:
 * 401 unauthenticated · 404 missing · 409 duplicate phone · 422 invalid
 * input · 500 anything unexpected.
 */

export { ApiError };

export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}

export function apiFailure(status: number, message: string): NextResponse {
  return NextResponse.json({ success: false, message }, { status });
}

/** Read a JSON body, returning null instead of throwing on empty/broken payloads. */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** First zod issue as the human-readable 422 message (matches inline form errors). */
export function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

/** Parse an integer query param with bounds; falls back when absent or malformed. */
export function intParam(
  value: string | null,
  fallback: number,
  min: number,
  max?: number
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

/** Escape user text before embedding it in a RegExp (search filters). */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps a route handler body: known ApiErrors keep their status, mongoose
 * duplicate-key (11000) and validation errors map to 409/422, and anything
 * else becomes an opaque 500 (details go to the server log, not the client).
 */
export async function withApi(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return apiFailure(error.status, error.message);
    }
    if (error instanceof mongoose.Error.ValidationError) {
      const first = Object.values(error.errors)[0];
      return apiFailure(422, first?.message ?? "Invalid input.");
    }
    if (error instanceof mongoose.Error.CastError) {
      return apiFailure(422, "One of the values has the wrong format.");
    }
    if ((error as { code?: number }).code === 11000) {
      return apiFailure(409, "That phone number already belongs to another customer.");
    }
    console.error("[api] unexpected error:", error);
    return apiFailure(500, "Something went wrong on the server.");
  }
}
