"use client";

import { CURRENCY_SYMBOL } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { FlowGranularity } from "@/types";

/**
 * Small shared pieces for the overview charts (FR-4.5). Colors live with
 * each chart; these are the neutral chrome every chart reuses.
 */

/** Compact axis currency ("৳1.2L", "৳85k") - lakh grouping like formatCurrency. */
const compact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function axisCurrency(value: number): string {
  return `${CURRENCY_SYMBOL}${compact.format(value)}`;
}

export function axisPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Legend row: colored chip + label, text always in text tokens. */
export function ChartLegendRow({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-[0.625rem] text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-xs"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Week / month / year segmented toggle for the flow chart (works.md F17). */
export function GranularityToggle({
  value,
  onChange,
}: {
  value: FlowGranularity;
  onChange: (next: FlowGranularity) => void;
}) {
  return (
    <div className="flex border p-0.5" role="radiogroup" aria-label="Flow chart granularity">
      {(["week", "month", "year"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-6 px-2.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            value === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
