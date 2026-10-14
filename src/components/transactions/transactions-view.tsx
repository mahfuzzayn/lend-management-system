"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  ArrowTurnBackwardIcon,
  Delete01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons";

import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { CustomerPicker } from "@/components/shared/customer-picker";
import { DatePicker } from "@/components/shared/date-picker";
import { ExportMenu } from "@/components/shared/export-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, errorMessage } from "@/lib/api-client";
import { downloadExport, transactionExportColumns, type ExportFormat } from "@/lib/export";
import { fadeUp } from "@/lib/motion";
import { cn, formatCurrency, formatDate, methodLabel, rowActionClass } from "@/lib/utils";
import type {
  AdminRole,
  Transaction,
  TransactionType,
  TransactionsPage,
} from "@/types";

const PAGE_SIZE = 15;
const SKELETON_ROWS = 8;

const DANGEROUS = "hover:text-destructive hover:ring-destructive/30";

interface Filters {
  customerId: string;
  type: "" | TransactionType;
  from: string;
  to: string;
}

const NO_FILTERS: Filters = { customerId: "", type: "", from: "", to: "" };

const FILTER_LABEL = "font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground";

export function TransactionsView({ role }: { role: AdminRole }) {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showTrash, setShowTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState<TransactionsPage["items"][number] | null>(null);
  const [purging, setPurging] = useState<TransactionsPage["items"][number] | null>(null);

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
        trash: showTrash || undefined,
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
  }, [filters, showTrash, page, reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);
  // The ?? [] fallback gets its own memo so dependent useMemos stay stable.
  const rows = useMemo(() => data?.items ?? [], [data]);
  const summary = data?.summary;
  const filterCustomerLabel = useMemo(() => {
    if (!filters.customerId) return undefined;
    const row = rows.find((r) => r.customerId === filters.customerId);
    return row ? [row.customerCode, row.customerName].filter(Boolean).join(" · ") : undefined;
  }, [filters.customerId, rows]);

  function setFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1); // any filter change restarts from the first page
  }

  /** Export walks every page of the CURRENT filter scope (FR-9b). */
  async function handleExport(format: ExportFormat): Promise<string> {
    const all: TransactionsPage["items"] = [];
    let exportPage = 1;
    for (;;) {
      const result = await api.listTransactions({
        customerId: filters.customerId || undefined,
        type: filters.type || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: exportPage,
        limit: 100,
      });
      all.push(...result.items);
      if (exportPage >= result.totalPages) break;
      exportPage += 1;
    }
    return downloadExport(format, "lendbook-transactions", transactionExportColumns(), all);
  }

  async function handleRestore(row: TransactionsPage["items"][number]) {
    try {
      await api.restoreTransaction(row.id);
      toast.success("Entry restored", {
        description: `${formatCurrency(row.amount)} · ${row.customerName} is back in the ledger.`,
      });
      reload();
    } catch (error) {
      toast.error("Couldn't restore that entry.", { description: errorMessage(error) });
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
      {/* Toolbar: filters + add */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-56">
            <span className={FILTER_LABEL}>Customer</span>
            <CustomerPicker
              value={filters.customerId}
              selectedLabel={filters.customerId ? filterCustomerLabel ?? "Selected customer" : "All customers"}
              includeAll
              onChange={(v) => setFilter({ customerId: v })}
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-36">
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
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-40">
            <span className={FILTER_LABEL}>From</span>
            <DatePicker
              value={filters.from}
              onChange={(v) => setFilter({ from: v })}
              max={filters.to || undefined}
              placeholder="Any date"
              aria-label="From date"
            />
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-40">
            <span className={FILTER_LABEL}>To</span>
            <DatePicker
              value={filters.to}
              onChange={(v) => setFilter({ to: v })}
              placeholder="Any date"
              aria-label="To date"
            />
          </div>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => setFilter(NO_FILTERS)}>
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2.5">
            <Switch
              id="transactions-show-trash"
              checked={showTrash}
              onCheckedChange={(checked) => {
                setShowTrash(checked);
                setPage(1);
              }}
            />
            <Label htmlFor="transactions-show-trash" className="text-xs text-muted-foreground">
              Show trash
            </Label>
          </label>
          {!showTrash && (
            <>
              <ExportMenu onExport={handleExport} disabled={loading || (data?.total ?? 0) === 0} />
              <Button onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add transaction
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary line for the current filter scope (server-computed, FR-7.6) */}
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
        {loading || !summary
          ? "…"
          : showTrash
            ? `${summary.count} entr${summary.count === 1 ? "y" : "ies"} in trash`
            : <>
                {summary.count} entr{summary.count === 1 ? "y" : "ies"} ·{" "}
                <span className="text-foreground">lent {formatCurrency(summary.totalLent)}</span> ·{" "}
                <span className="text-emerald-600">repaid {formatCurrency(summary.totalReceived)}</span>
              </>}
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
              <TableHead className="hidden xl:table-cell">
                {showTrash ? "Trashed" : "Added by"}
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
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
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-7 w-20" /></TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.id} className={showTrash ? "opacity-75" : undefined}>
                    <TableCell className="text-xs">{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${row.customerId}`}
                        className="flex flex-col"
                      >
                        <span className="text-xs font-medium hover:underline">
                          {row.customerName}
                          {showTrash && row.customerDeleted && (
                            <span
                              title="Their customer is in the trash - restore the customer to bring these entries back"
                              className="ml-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-amber-700"
                            >
                              owner trashed
                            </span>
                          )}
                        </span>
                        {row.customerCode && (
                          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                            {row.customerCode}
                          </span>
                        )}
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
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {methodLabel(row.method)}
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate text-xs text-muted-foreground lg:table-cell">
                      {row.note ?? "-"}
                    </TableCell>
                    <TableCell className="hidden max-w-32 truncate text-xs text-muted-foreground xl:table-cell">
                      {showTrash
                        ? row.deletedAt
                          ? `trashed ${formatDate(row.deletedAt)}`
                          : "-"
                        : row.addedBy ?? "-"}
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
                      {showTrash ? (
                        <div className="flex justify-end gap-1">
                          {/* Cascade-deleted entries restore only with their
                              customer (§5.7) - the API rejects it, the button
                              states why instead of failing on click. */}
                          <Button
                            variant="ghost"
                            className={rowActionClass}
                            aria-label={
                              row.customerDeleted
                                ? `Restore their customer first to bring back the entry of ${formatCurrency(row.amount)} for ${row.customerName}`
                                : `Restore entry of ${formatCurrency(row.amount)} for ${row.customerName}`
                            }
                            title={row.customerDeleted ? "Restore their customer first" : undefined}
                            disabled={row.customerDeleted}
                            onClick={() => {
                              void handleRestore(row);
                            }}
                          >
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
                          </Button>
                          {role === "super-admin" && (
                            <Button
                              variant="ghost"
                              className={`${rowActionClass} ${DANGEROUS}`}
                              aria-label={`Permanently delete entry of ${formatCurrency(row.amount)} for ${row.customerName}`}
                              onClick={() => setPurging(row)}
                            >
                              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            className={rowActionClass}
                            aria-label="Edit transaction"
                            onClick={() => {
                              setEditing(row);
                              setEditingLabel(
                                [row.customerCode, row.customerName].filter(Boolean).join(" · ")
                              );
                            }}
                          >
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            className={`${rowActionClass} ${DANGEROUS}`}
                            aria-label="Move transaction to trash"
                            onClick={() => setDeleting(row)}
                          >
                            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {/* Footer: pagination or empty state */}
        {!loading && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {showTrash
                ? "The trash is empty."
                : !filtersActive
                  ? "No transactions yet."
                  : "Nothing matches these filters."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {showTrash
                ? "Deleted entries wait here until a super admin removes them for good."
                : !filtersActive
                  ? "Record the first lend or repayment - the ledger starts there."
                  : "Widen the date range or clear a filter or two."}
            </p>
            {!filtersActive && !showTrash ? (
              <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add transaction
              </Button>
            ) : (
              filtersActive && (
                <Button variant="outline" className="mt-2" onClick={() => setFilter(NO_FILTERS)}>
                  Reset filters
                </Button>
              )
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
      {!showTrash && (
        <>
          <TransactionFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={reload} />
          <TransactionFormDialog
            open={Boolean(editing)}
            onOpenChange={(open) => !open && setEditing(null)}
            transaction={editing}
            customerLabel={editingLabel}
            onSaved={reload}
          />
        </>
      )}
      <DeleteTransactionDialog
        transaction={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={reload}
      />
      <DeleteTransactionDialog
        transaction={purging}
        purge
        onOpenChange={(open) => !open && setPurging(null)}
        onDeleted={reload}
      />
    </motion.div>
  );
}
