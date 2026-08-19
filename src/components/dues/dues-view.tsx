"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Download04Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { downloadCustomerHistoryPdf } from "@/components/pdf/download-customer-history-pdf";
import { DueBadge } from "@/components/shared/due-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { customersWithDue, customerSummary, withRunningBalance } from "@/lib/domain";
import { useMockStore } from "@/lib/mock-store";
import { fadeUp } from "@/lib/motion";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

const SKELETON_ROWS = 6;

export function DuesView() {
  const { customers, transactions } = useMockStore();

  // v1: simulate the request latency the skeletons are designed for.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [showSettled, setShowSettled] = useState(false);

  const rows = useMemo(() => {
    const active = customersWithDue(
      customers.filter((c) => c.status === "active"),
      transactions
    );
    return active
      .filter((r) => (showSettled ? true : r.due > 0))
      .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
  }, [customers, transactions, showSettled]);

  const normalized = debouncedQuery.trim().toLowerCase();
  const filtered = normalized
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(normalized) || r.phone.toLowerCase().includes(normalized)
      )
    : rows;

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

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
      {/* Toolbar */}
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
            placeholder="Search name or phone…"
            className="pl-8"
            aria-label="Search dues"
          />
        </div>

        <div className="flex items-center gap-6">
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
                        <span className="text-xs font-medium hover:underline">{row.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">
                      {row.phone}
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
                        <Button asChild variant="ghost" size="icon-xs" aria-label={`View ${row.name}`}>
                          <Link href={`/dashboard/customers/${row.id}`}>
                            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Download history PDF for ${row.name}`}
                          onClick={() => {
                            const own = transactions.filter((t) => t.customerId === row.id);
                            void downloadCustomerHistoryPdf({
                              customer: row,
                              summary: customerSummary(own),
                              ledger: withRunningBalance(own),
                            }).catch(() => undefined);
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

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {normalized
                ? "No customers match that search."
                : showSettled
                  ? "No customers yet."
                  : "No outstanding dues - everyone's square."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {normalized
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
