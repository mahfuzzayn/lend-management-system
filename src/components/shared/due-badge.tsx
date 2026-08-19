import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { DueStatus } from "@/types";

const CONFIG: Record<DueStatus, { label: string; className: string }> = {
  due: { label: "Due", className: "bg-red-600 text-white" },
  settled: { label: "Settled", className: "bg-emerald-600 text-white" },
  advance: { label: "Adv", className: "bg-blue-600 text-white" },
};

/**
 * Ledger standing chip - always carries text, never color alone (NFR-4).
 * `advance` shows the absolute overpaid amount.
 */
export function DueBadge({
  due,
  dueStatus,
  className,
}: {
  due: number;
  dueStatus: DueStatus;
  className?: string;
}) {
  const config = CONFIG[dueStatus];
  return (
    <Badge className={cn("font-mono tabular-nums", config.className, className)}>
      {dueStatus === "due" && `${config.label} ${formatCurrency(due)}`}
      {dueStatus === "settled" && "Settled"}
      {dueStatus === "advance" && `Advance ${formatCurrency(Math.abs(due))}`}
    </Badge>
  );
}
