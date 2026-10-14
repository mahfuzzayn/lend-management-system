"use client";

import { formatCurrency } from "@/lib/utils";
import { DueBadge } from "@/components/shared/due-badge";
import type { CustomerSummary } from "@/types";

/**
 * Collection progress (FR-4.5c, works.md F17): one filled bar - the
 * emerald share of everything lent that has come back, the red share still
 * out - with the Lent out / Repaid / Due figures beside it. The v1.4-draft
 * rate line chart gave way to this on request.
 */
export function CollectionBar({ summary }: { summary: CustomerSummary }) {
  const lent = summary.totalLent;
  const collected = summary.totalReceived;
  // Share of lent that has been collected; an advance tops out the bar.
  const collectedPct = lent > 0 ? Math.min(100, (collected / lent) * 100) : 0;
  const advance = summary.due < 0;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
          {lent > 0 ? `${collectedPct.toFixed(1)}%` : "–"}
          <span className="ml-2 text-xs font-normal text-muted-foreground">collected of lent</span>
        </p>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
          {formatCurrency(collected)} / {formatCurrency(lent)}
        </p>
      </div>

      {/* The filled bar: emerald = collected share, red = still out. */}
      <div
        role="progressbar"
        aria-label="Collection progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(collectedPct)}
        className="flex h-3 w-full overflow-hidden rounded-sm bg-(--brand-secondary)/15"
      >
        <div
          className="h-full rounded-sm bg-emerald-600 transition-[width] duration-500"
          style={{ width: `${collectedPct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2 border px-3 py-2 sm:flex-col sm:items-start sm:justify-start">
          <span className="flex items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
            <span aria-hidden className="size-2 rounded-xs bg-(--brand-secondary)" />
            lent out
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums">
            {formatCurrency(lent)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border px-3 py-2 sm:flex-col sm:items-start sm:justify-start">
          <span className="flex items-center gap-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
            <span aria-hidden className="size-2 rounded-xs bg-emerald-500" />
            repaid
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums">
            {formatCurrency(collected)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border px-3 py-2 sm:flex-col sm:items-start sm:justify-start">
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
            {advance ? "advance" : "due"}
          </span>
          <DueBadge due={summary.due} dueStatus={summary.dueStatus} />
        </div>
      </div>

      {advance && (
        <p className="text-[0.625rem] text-muted-foreground">
          Overpaid by {formatCurrency(Math.abs(summary.due))} - the customer is in advance.
        </p>
      )}
    </div>
  );
}
