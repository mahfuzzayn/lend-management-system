"use client";

import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import type { FlowPoint } from "@/types";
import { axisCurrency, ChartLegendRow } from "./chart-bits";

/**
 * Money out vs in per bucket (FR-4.5a). The pair is the app's semantic duo -
 * red = lend out, emerald = repayment in - the same identity every table
 * and badge already uses (validated CVD-safe against the card surface).
 */
const chartConfig = {
  lend: { label: "Lent (out)", color: "#f30608" },
  repayment: { label: "Repaid (in)", color: "#059669" },
} satisfies ChartConfig;

export function FlowChart({ data }: { data: FlowPoint[] }) {
  const reduced = useReducedMotion();

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <ChartLegendRow
        items={[
          { label: "Lent (out)", color: "#f30608" },
          { label: "Repaid (in)", color: "#059669" },
        ]}
      />
      <ChartContainer config={chartConfig} className="h-56 w-full sm:h-64">
        <BarChart
          data={data}
          barGap={2}
          barCategoryGap="26%"
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={16}
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value) => axisCurrency(Number(value))}
            tick={{ fontSize: 10 }}
            className="text-muted-foreground"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-6 text-xs">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="lend"
            fill="var(--color-lend)"
            radius={[4, 4, 0, 0]}
            barSize={10}
            isAnimationActive={!reduced}
          />
          <Bar
            dataKey="repayment"
            fill="var(--color-repayment)"
            radius={[4, 4, 0, 0]}
            barSize={10}
            isAnimationActive={!reduced}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
