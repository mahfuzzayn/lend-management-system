import { PROJECT } from "@/lib/project";

/**
 * Non-secret client constants. The business identity lives in
 * `lib/project.ts` (the one-file clone point, works.md F27); this module
 * keeps the historical names the app imports. Secrets live in env vars
 * (see requirements §12).
 */

export const APP_NAME = PROJECT.brand.name;

export const APP_TAGLINE = PROJECT.brand.tagline;

export const APP_DESCRIPTION = PROJECT.brand.description;

/** Currency symbol used by formatCurrency() and the PDF export. Default: BDT. */
export const CURRENCY_SYMBOL = "৳";
