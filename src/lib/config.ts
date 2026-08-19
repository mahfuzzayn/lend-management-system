/**
 * Non-secret client constants - the single source of truth for app-wide
 * display values. Secrets live in env vars (see requirements §12).
 */

export const APP_NAME = "Lendbook";

export const APP_TAGLINE = "Lend clearly. Collect confidently.";

export const APP_DESCRIPTION =
  "A minimal lend management system - track customers, lend transactions, repayments and outstanding dues in one calm dashboard.";

/** Currency symbol used by formatCurrency() and the PDF export. Default: BDT. */
export const CURRENCY_SYMBOL = "৳";

/**
 * v1 mock-auth credential (shown on the login page).
 * v2: the seed script creates the real admin from env vars using the same values.
 */
export const DEMO_CREDENTIAL = {
  email: "admin@lendbook.morlabs.co",
  password: "12345678",
} as const;

/** localStorage key for the v1 mock session flag. */
export const MOCK_SESSION_KEY = "lendbook.mock-session";
