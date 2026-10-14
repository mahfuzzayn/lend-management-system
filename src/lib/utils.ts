import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { CURRENCY_SYMBOL } from "@/lib/config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Indian/BD lakh-style digit grouping (1,25,000). */
const numberFormatters = {
  plain: new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }),
  decimal: new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
}

/**
 * Format a money amount with the configured currency symbol.
 * Uses lakh grouping (en-IN), which matches BDT conventions.
 *
 * @example formatCurrency(125000) // "৳1,25,000"
 * @example formatCurrency(1250.5, { decimals: true }) // "৳1,250.50"
 * @example formatCurrency(125000, { signed: true }) // "+৳1,25,000"
 */
export function formatCurrency(
  amount: number,
  { decimals = false, signed = false }: { decimals?: boolean; signed?: boolean } = {}
) {
  const formatter = decimals ? numberFormatters.decimal : numberFormatters.plain
  const sign = signed && amount > 0 ? "+" : ""
  return `${sign}${CURRENCY_SYMBOL}${formatter.format(Math.abs(amount))}`
}

/**
 * Format an ISO date as a compact human date.
 * @example formatDate("2026-08-19T10:00:00Z") // "19 Aug 2026"
 */
export function formatDate(iso: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

/**
 * Uppercase initials from a name (max 2), for avatar chips.
 * @example getInitials("Mahfuz Zayn") // "MZ"
 */
export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** First letter capitalized, rest lowercase, hyphens/underscores → spaces. */
function labelize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

/** Display labels for the stored enums - same wording everywhere (UI, PDF, exports). */
export function methodLabel(method: string) {
  return labelize(method)
}

export function businessTypeLabel(type: string) {
  return labelize(type).replace("Retail Shop", "Retail shop")
}

export function riskLabel(level: string) {
  return labelize(level)
}

export function recoveryStatusLabel(status: string) {
  return labelize(status)
}

/**
 * Shared size + hover recipe for table row action buttons (works.md F12):
 * big enough to hit, with a visible ring on hover. Destructive callers
 * append " hover:text-destructive hover:ring-destructive/30".
 */
export const rowActionClass =
  "size-7 rounded-sm hover:bg-muted hover:ring-1 hover:ring-ring/20 active:translate-y-0"
