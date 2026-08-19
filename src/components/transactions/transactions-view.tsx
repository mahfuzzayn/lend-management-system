"use client";

import { useEffect, useMemo, useState } from "react";
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
import { transactionsWithCustomer } from "@/lib/domain";
import { useMockStore } from "@/lib/mock-store";
import { fadeUp } from "@/lib/motion";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction, TransactionWithCustomer, TransactionType } from "@/types";

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
  const { customers, transactions } = useMockStore();

  // v1: simulate the request latency the skeletons are designed for.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState({ key: "", index: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithCustomer | null>(null);

  const rows = useMemo(
    () => transactionsWithCustomer(transactions, customers),
    [transactions, customers]
  );

  const filtersActive =
    filters.customerId !== "" || filters.type !== "" || filters.from !== "" || filters.to !== "";

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filters.customerId && r.customerId !== filters.customerId) return false;
        if (filters.type && r.type !== filters.type) return false;
        const day = r.date.slice(0, 10);
        if (filters.from && day < filters.from) return false;
        if (filters.to && day > filters.to) return false;
        return true;
      }),
    [rows, filters]
  );

  const summary = useMemo(() => {
    let lent = 0;
    let received = 0;
    for (const r of filtered) {
      if (r.type === "lend") lent += r.amount;
      else received += r.amount;
    }
    return { count: filtered.length, lent, received };
  }, [filtered]);

  const filterKey = `${filters.customerId}|${filters.type}|${filters.from}|${filters.to}`;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = page.key === filterKey ? Math.min(page.index, pageCount) : 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(index: number) {
    setPage({ key: filterKey, index });
  }

  function setFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
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
                {customers
                  .filter((c) => c.status === "active")
                  .map((c) => (
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
            <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>
              Reset
            </Button>
          )}
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add transaction
        </Button>
      </div>

      {/* Summary line for the current filter scope */}
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
        {loading ? "…" : (
          <>
            {summary.count} entr{summary.count === 1 ? "y" : "ies"} ·{" "}
            <span className="text-foreground">lent {formatCurrency(summary.lent)}</span> ·{" "}
            <span className="text-emerald-600">repaid {formatCurrency(summary.received)}</span>
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
              : paginated.map((row) => (
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
        {!loading && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {rows.length === 0
                ? "No transactions yet."
                : "Nothing matches these filters."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {rows.length === 0
                ? "Record the first lend or repayment - the ledger starts there."
                : "Widen the date range or clear a filter or two."}
            </p>
            {rows.length === 0 ? (
              <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add transaction
              </Button>
            ) : (
              <Button variant="outline" className="mt-2" onClick={() => setFilters(NO_FILTERS)}>
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          !loading && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                page {currentPage} / {pageCount}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  aria-label="Previous page"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={currentPage >= pageCount}
                  onClick={() => goToPage(Math.min(pageCount, currentPage + 1))}
                  aria-label="Next page"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            </div>
          )
        )}
      </Card>

      {/* Dialogs */}
      <TransactionFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TransactionFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        transaction={editing}
      />
      <DeleteTransactionDialog
        transaction={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </motion.div>
  );
}
