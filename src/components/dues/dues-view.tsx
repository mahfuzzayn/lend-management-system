"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Download04Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { downloadCustomerHistoryPdf } from "@/components/pdf/download-customer-history-pdf";
import { DueBadge } from "@/components/shared/due-badge";
import { ExportMenu } from "@/components/shared/export-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounced } from "@/hooks/use-debounced";
import { api, errorMessage } from "@/lib/api-client";
import { customerExportColumns, downloadExport, type ExportFormat } from "@/lib/export";
import { fadeUp } from "@/lib/motion";
import {
  formatCurrency,
  formatDate,
  getInitials,
  recoveryStatusLabel,
  riskLabel,
  rowActionClass,
} from "@/lib/utils";
import type { CustomerWithDue, RecoveryStatus, RiskLevel } from "@/types";

const SKELETON_ROWS = 6;

const FILTER_LABEL =
  "font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground";

export function DuesView() {
  const [rows, setRows] = useState<CustomerWithDue[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [showSettled, setShowSettled] = useState(false);
  const [riskLevel, setRiskLevel] = useState<"" | RiskLevel>("");
  const [recoveryStatus, setRecoveryStatus] = useState<"" | RecoveryStatus>("");

  const filtersActive = riskLevel !== "" || recoveryStatus !== "";

  useEffect(() => {
    let cancelled = false;
    // Skeletons only on the first load - refetches keep the rows on screen.
    api
      .dues({
        search: debouncedQuery.trim() || undefined,
        onlyWithDue: !showSettled,
        riskLevel: riskLevel || undefined,
        recoveryStatus: recoveryStatus || undefined,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, showSettled, riskLevel, recoveryStatus, reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);
  const filtered = useMemo(() => rows ?? [], [rows]);
  const searching = debouncedQuery.trim().length > 0 || filtersActive;

  const totals = useMemo(() => {
    let lent = 0;
    let received = 0;
    let outstanding = 0;
    for (const r of filtered) {
      lent += r.totalLent;
      received += r.totalReceived;
      outstanding += r.due;
    }
    return { lent, received, outstanding };
  }, [filtered]);

  async function handleRowPdf(row: CustomerWithDue) {
    try {
      const detail = await api.getCustomer(row.id);
      await downloadCustomerHistoryPdf({
        customer: detail.customer,
        summary: detail.summary,
        ledger: detail.transactions,
      });
    } catch (error) {
      // downloadCustomerHistoryPdf toasts its own generation failures;
      // anything here is the ledger fetch itself failing.
      if (!(error instanceof Error && error.message.includes("PDF"))) {
        toast.error("Couldn't load the ledger for the PDF.", {
          description: errorMessage(error),
        });
      }
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, phone, area…"
              className="pl-8"
              aria-label="Search dues"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2.5">
              <Switch
                id="show-settled"
                checked={showSettled}
                onCheckedChange={setShowSettled}
              />
              <Label htmlFor="show-settled" className="text-xs text-muted-foreground">
                Show settled &amp; advances
              </Label>
            </label>
            <p className="hidden font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground sm:block">
              {loading ? "…" : `${filtered.length} standing`}
            </p>
            <ExportMenu
              onExport={(format: ExportFormat) =>
                downloadExport(format, "lendbook-dues", customerExportColumns(), filtered)
              }
              disabled={loading || filtered.length === 0}
            />
          </div>
        </div>

        {/* Filter selects (works.md F11). */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-36">
            <span className={FILTER_LABEL}>Risk level</span>
            <Select
              value={riskLevel || "any"}
              onValueChange={(v) => setRiskLevel(v === "any" ? "" : (v as RiskLevel))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any risk</SelectItem>
                {(["low", "medium", "high", "critical"] as const).map((level) => (
                  <SelectItem key={level} value={level}>
                    {riskLabel(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-44">
            <span className={FILTER_LABEL}>Recovery status</span>
            <Select
              value={recoveryStatus || "any"}
              onValueChange={(v) => setRecoveryStatus(v === "any" ? "" : (v as RecoveryStatus))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                {(
                  [
                    "not-contacted",
                    "contacted",
                    "promise-made",
                    "partial-payment",
                    "completed",
                    "refused",
                    "disputed",
                    "legal-action",
                  ] as const
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {recoveryStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-1.5"
              onClick={() => {
                setRiskLevel("");
                setRecoveryStatus("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <Card className="gap-0 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Lent</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Received</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead className="hidden lg:table-cell">Last activity</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="ml-auto h-3 w-16" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="ml-auto h-3 w-16" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell><Skeleton className="ml-auto h-6 w-14" /></TableCell>
                  </TableRow>
                ))
              : filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${row.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center bg-muted text-[0.625rem] font-semibold">
                          {getInitials(row.name)}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="flex items-baseline gap-2">
                            {row.customerCode && (
                              <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                                {row.customerCode}
                              </span>
                            )}
                            <span className="truncate text-xs font-medium hover:underline">{row.name}</span>
                          </span>
                          {row.businessName && (
                            <span className="truncate text-[0.625rem] text-muted-foreground">
                              {row.businessName}
                            </span>
                          )}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {row.phone ?? "-"}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-xs tabular-nums sm:table-cell">
                      {formatCurrency(row.totalLent)}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-xs tabular-nums sm:table-cell">
                      {formatCurrency(row.totalReceived)}
                    </TableCell>
                    <TableCell>
                      <DueBadge due={row.due} dueStatus={row.dueStatus} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {row.lastTransactionDate ? formatDate(row.lastTransactionDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" className={rowActionClass} aria-label={`View ${row.name}`}>
                          <Link href={`/dashboard/customers/${row.id}`}>
                            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          className={rowActionClass}
                          aria-label={`Download history PDF for ${row.name}`}
                          onClick={() => {
                            void handleRowPdf(row);
                          }}
                        >
                          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>

          {/* Totals footer over the visible scope */}
          {!loading && filtered.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                  totals
                </TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="hidden text-right font-mono text-xs font-medium tabular-nums sm:table-cell">
                  {formatCurrency(totals.lent)}
                </TableCell>
                <TableCell className="hidden text-right font-mono text-xs font-medium tabular-nums sm:table-cell">
                  {formatCurrency(totals.received)}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-semibold tabular-nums text-red-600">
                    {formatCurrency(totals.outstanding)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell" />
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>

        {!loading && loadError && (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium text-destructive">Couldn&apos;t load dues.</p>
            <p className="max-w-xs text-xs text-muted-foreground">{loadError}</p>
            <Button variant="outline" className="mt-2" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {searching
                ? "No customers match that search."
                : showSettled
                  ? "No customers yet."
                  : "No outstanding dues - everyone's square."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {searching
                ? "Try a different name or phone number."
                : showSettled
                  ? "Customers appear here once you start lending."
                  : "Flip the switch to see settled customers and advances too."}
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
