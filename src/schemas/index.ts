import { z } from "zod";

/**
 * Shared zod schemas (requirements §6 / FR-10.5) - used by v1 dialogs now and
 * by the v2 API handlers later, so client and server validation always agree.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d+\-\s()]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name needs at least 2 characters.")
    .max(80, "Keep the name under 80 characters."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_RE, "Use digits, spaces, + and - only.")
    .max(20, "Keep the phone number under 20 characters.")
    .refine((v) => v.replace(/\D/g, "").length >= 6, "Phone needs at least 6 digits."),
  email: z
    .string()
    .trim()
    .regex(EMAIL_RE, "Enter a valid e-mail address.")
    .or(z.literal("")),
  address: z.string().trim().max(240, "Keep the address under 240 characters."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});
export type CustomerFormValues = z.infer<typeof customerSchema>;

export const transactionSchema = z.object({
  customerId: z.string().min(1, "Pick a customer."),
  type: z.enum(["lend", "repayment"]),
  amount: z
    .number()
    .positive("Amount must be greater than zero.")
    .max(99_999_999, "Amount is too large."),
  // Same rule the date input enforces (max=local today): back-datable, never
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
  note: z.string().trim().max(240, "Keep the note under 240 characters."),
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
