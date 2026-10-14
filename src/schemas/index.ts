import { z } from "zod";

/**
 * Shared zod schemas (requirements §6 / FR-10.5) - used by v1 dialogs now and
 * by the v2 API handlers later, so client and server validation always agree.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-\s()]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Optional text: empty string means "absent" everywhere (forms always send strings). */
const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).or(z.literal(""));

/** Optional enum: empty string means "absent" (selects send ""). */
function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values).or(z.literal(""));
}

const BUSINESS_TYPES = ["workshop", "contractor", "retail-shop", "company", "individual"] as const;
export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const RECOVERY_STATUSES = [
  "not-contacted",
  "contacted",
  "promise-made",
  "partial-payment",
  "completed",
  "refused",
  "disputed",
  "legal-action",
] as const;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name needs at least 2 characters.")
    .max(80, "Keep the name under 80 characters."),
  customerCode: optionalText(12, "Keep the customer code under 12 characters."),
  phone: z
    .string()
    .trim()
    .max(20, "Keep the phone number under 20 characters.")
    .refine(
      (v) => v === "" || (PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 6),
      "Phone needs at least 6 digits - digits, spaces, + and - only."
    ),
  businessName: optionalText(120, "Keep the business name under 120 characters."),
  alternativePhone: z
    .string()
    .trim()
    .max(20, "Keep the alternative phone under 20 characters.")
    .refine(
      (v) => v === "" || (PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 6),
      "Alternative phone needs at least 6 digits - digits, spaces, + and - only."
    ),
  email: z
    .string()
    .trim()
    .regex(EMAIL_RE, "Enter a valid e-mail address.")
    .or(z.literal("")),
  address: optionalText(240, "Keep the address under 240 characters."),
  area: optionalText(120, "Keep the area under 120 characters."),
  businessType: optionalEnum(BUSINESS_TYPES),
  customerCategory: optionalText(40, "Keep the category under 40 characters."),
  // Customer-since is optional; when present it is a plain YYYY-MM-DD date.
  customerSince: z
    .string()
    .regex(ISO_DATE_RE, "Pick a valid date.")
    .or(z.literal("")),
  riskLevel: optionalEnum(RISK_LEVELS),
  recoveryStatus: optionalEnum(RECOVERY_STATUSES),
  notes: optionalText(500, "Keep notes under 500 characters."),
});
export type CustomerFormValues = z.infer<typeof customerSchema>;

export const transactionSchema = z.object({
  customerId: z.string().min(1, "Pick a customer."),
  type: z.enum(["lend", "repayment"]),
  amount: z
    .number()
    .positive("Amount must be greater than zero.")
    .max(99_999_999, "Amount is too large."),
  // Same rule the calendar enforces (max=local today): back-datable, never
  // future - with one UTC day of tolerance so users ahead of UTC can still
  // record their own "today" after it turns tomorrow in UTC.
  date: z
    .string()
    .regex(ISO_DATE_RE, "Pick a valid date.")
    .refine(
      (d) => d <= new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      "Pick today or an earlier date."
    ),
  method: z.enum(["cash", "bank", "mobile-banking", "other"]),
  note: optionalText(240, "Keep the note under 240 characters."),
  addedBy: optionalText(60, "Keep the added-by name under 60 characters."),
  referenceCode: optionalText(20, "Keep the reference code under 20 characters."),
  productCategory: optionalText(60, "Keep the product category under 60 characters."),
  verificationStatus: optionalText(40, "Keep the verification status under 40 characters."),
  referenceSource: optionalText(120, "Keep the reference source under 120 characters."),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_RE, "Enter a valid e-mail address."),
  password: z.string().min(8, "Password needs at least 8 characters."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/** Flatten a zod error into a `{ field: message }` record for inline display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const record: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!record[key]) record[key] = issue.message;
  }
  return record;
}
