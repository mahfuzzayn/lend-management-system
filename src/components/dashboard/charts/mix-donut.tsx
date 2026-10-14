"use client";

import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/** One donut segment: identity + count + a secondary figure for the tooltip. */
export interface MixSlice {
  key: string;
  label: string;
  count: number;
  /** Secondary figure shown in the tooltip (outstanding, amount, …). */
  secondary: number;
}

const chartConfig = {
  count: { label: "Entries" },
} satisfies ChartConfig;

/**
 * Generic mix donut (FR-4.5b + per-customer insights). Segment colors are
 * FIXED per key (entity-stable - they never repaint when counts shift);
 * 2px surface gaps + the labeled legend + tooltips are the secondary
 * encoding covering any warn-band color pair. The chart container sits at
 * z-10 over the z-0 center label so the tooltip always stacks ABOVE the
 * hero number (works.md F17).
 */
export function MixDonut({
  data,
  fillFor,
  formatSecondary,
  centerWord = "entries",
}: {
  data: MixSlice[];
  /** Fixed key → fill mapping (callers own the palette). */
  fillFor: (key: string) => string;
  /** Second tooltip line, e.g. "due ৳1,250" or "৳45,000 through cash". */
  formatSecondary: (slice: MixSlice) => string;
  centerWord?: string;
}) {
  const reduced = useReducedMotion();
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="flex min-w-0 flex-col-reverse items-center gap-4 sm:flex-row">
      <div className="relative h-48 w-48 shrink-0 sm:h-52 sm:w-52">
        <ChartContainer config={chartConfig} className="relative z-10 h-48 w-48 sm:h-52 sm:w-52">
          <PieChart>
            <ChartTooltip
              cursor={false}
              wrapperStyle={{ zIndex: 40 }}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const slice = (item as { payload?: MixSlice } | undefined)?.payload;
                    return (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium">{slice?.label ?? name}</span>
                        <span className="font-mono text-[0.625rem] text-muted-foreground">
                          {Number(value)} {centerWord} · {slice ? formatSecondary(slice) : ""}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius="64%"
              outerRadius="96%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={!reduced}
            >
              {data.map((slice) => (
                <Cell key={slice.key} fill={fillFor(slice.key)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Hero number in the hole - z-0 keeps it BELOW the tooltip (F17). */}
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold tabular-nums">{total}</span>
          <span className="font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
            {centerWord}
          </span>
        </div>
      </div>

      {/* Labeled legend with counts - identity never rides on color alone. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {data.map((slice) => (
          <div key={slice.key} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-xs"
              style={{ backgroundColor: fillFor(slice.key) }}
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.label}</span>
            <span className="font-mono tabular-nums text-foreground">{slice.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
