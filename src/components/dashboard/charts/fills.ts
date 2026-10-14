/**
 * Fixed key → fill maps for the mix donuts (entity-stable: a status or
 * method keeps its color whatever the counts do). The categorical ramp is
 * the validated --chart-1…6 set in globals.css; neutral grays mark the
 * aggregates ("Not set", "Other").
 */

export const RECOVERY_FILL: Record<string, string> = {
  contacted: "var(--chart-1)",
  "not-contacted": "var(--chart-2)",
  "promise-made": "var(--chart-3)",
  "partial-payment": "var(--chart-4)",
  disputed: "var(--chart-5)",
  completed: "var(--chart-6)",
  "not-set": "#a1a1aa",
  other: "#52525b",
};

export const METHOD_FILL: Record<string, string> = {
  cash: "var(--chart-1)",
  "mobile-banking": "var(--chart-2)",
  bank: "var(--chart-3)",
  other: "var(--chart-4)",
};
