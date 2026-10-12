"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowRight01Icon, Delete01Icon, Edit01Icon } from "@hugeicons/core-free-icons";

import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, errorMessage } from "@/lib/api-client";
import { fadeUp } from "@/lib/motion";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  CustomerWithDue,
  Transaction,
  TransactionType,
  TransactionsPage,
} from "@/types";

const PAGE_SIZE = 15;
const SKELETON_ROWS = 8;

interface Filters {
  customerId: string;
  type: "" | TransactionType;
  from: string;
  to: string;
}

const NO_FILTERS: Filters = { customerId: "", type: "", from: "", to: "" };

const FILTER_LABEL = "font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground";

export function TransactionsView() {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [customerOptions, setCustomerOptions] = useState<CustomerWithDue[]>([]);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<TransactionsPage["items"][number] | null>(null);

  const filtersActive =
    filters.customerId !== "" || filters.type !== "" || filters.from !== "" || filters.to !== "";

  useEffect(() => {
    let cancelled = false;
    // Skeletons only on the first load - refetches (filters/page/reload) keep
    // the current rows on screen instead of flashing.
    api
      .listTransactions({
        customerId: filters.customerId || undefined,
        type: filters.type || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page, reloadNonce]);

  // Customer filter options (active customers only).
  useEffect(() => {
    let cancelled = false;
    api
      .listCustomers({ limit: 100 })
      .then((result) => {
        if (!cancelled) setCustomerOptions(result.items);
      })
      .catch(() => undefined); // filter list stays empty - not worth a toast
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = () => setReloadNonce((n) => n + 1);
  const rows = data?.items ?? [];
  const summary = data?.summary;

  function setFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1); // any filter change restarts from the first page
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
      {/* Toolbar: filters + add */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex w-44 flex-col gap-1">
            <span className={FILTER_LABEL}>Customer</span>
            <Select
              value={filters.customerId || "all"}
              onValueChange={(v) => setFilter({ customerId: v === "all" ? "" : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex w-36 flex-col gap-1">
            <span className={FILTER_LABEL}>Type</span>
            <Select
              value={filters.type || "all"}
              onValueChange={(v) => setFilter({ type: v === "all" ? "" : (v as TransactionType) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="lend">Lend</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={FILTER_LABEL}>From</span>
            <Input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => setFilter({ from: e.target.value })}
              className="w-36"
              aria-label="From date"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={FILTER_LABEL}>To</span>
            <Input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setFilter({ to: e.target.value })}
              className="w-36"
              aria-label="To date"
            />
          </label>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => setFilter(NO_FILTERS)}>
              Reset
            </Button>
          )}
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add transaction
        </Button>
      </div>

      {/* Summary line for the current filter scope (server-computed, FR-7.6) */}
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
        {loading || !summary ? "…" : (
          <>
            {summary.count} entr{summary.count === 1 ? "y" : "ies"} ·{" "}
            <span className="text-foreground">lent {formatCurrency(summary.totalLent)}</span> ·{" "}
            <span className="text-emerald-600">repaid {formatCurrency(summary.totalReceived)}</span>
          </>
        )}
      </p>

      {/* Table card */}
      <Card className="gap-0 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="hidden lg:table-cell">Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-3 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-3 w-24" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-6 w-14" /></TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${row.customerId}`}
                        className="text-xs font-medium hover:underline"
                      >
                        {row.customerName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono uppercase",
                          row.type === "lend"
                            ? "border-red-200 text-red-700"
                            : "border-emerald-200 text-emerald-700"
                        )}
                      >
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs capitalize text-muted-foreground md:table-cell">
                      {row.method === "mobile-banking" ? "mobile banking" : row.method}
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground lg:table-cell">
                      {row.note ?? "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono text-xs tabular-nums",
                        row.type === "repayment" && "text-emerald-600"
                      )}
                    >
                      {formatCurrency(row.type === "lend" ? -row.amount : row.amount, { signed: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Edit transaction"
                          onClick={() => setEditing(row)}
                        >
                          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete transaction"
                          onClick={() => setDeleting(row)}
                        >
                          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {/* Footer: pagination or empty state */}
        {!loading && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {!filtersActive ? "No transactions yet." : "Nothing matches these filters."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {!filtersActive
                ? "Record the first lend or repayment - the ledger starts there."
                : "Widen the date range or clear a filter or two."}
            </p>
            {!filtersActive ? (
              <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add transaction
              </Button>
            ) : (
              <Button variant="outline" className="mt-2" onClick={() => setFilter(NO_FILTERS)}>
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          !loading && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                page {data?.page ?? 1} / {data?.totalPages ?? 1}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={page >= (data?.totalPages ?? 1)}
                  onClick={() => setPage(Math.min(data?.totalPages ?? 1, page + 1))}
                  aria-label="Next page"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          )
        )}
      </Card>

      {loadError && (
        <p className="text-center font-mono text-[0.625rem] uppercase tracking-[0.15em] text-destructive">
          {loadError}
        </p>
      )}

      {/* Dialogs */}
      <TransactionFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={reload} />
      <TransactionFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        transaction={editing}
        onSaved={reload}
      />
      <DeleteTransactionDialog
        transaction={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={reload}
      />
    </motion.div>
  );
}
