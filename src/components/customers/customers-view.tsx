"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowTurnBackwardIcon,
  Delete01Icon,
  Edit01Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounced } from "@/hooks/use-debounced";
import { api, errorMessage } from "@/lib/api-client";
import { customerExportColumns, downloadExport, type ExportFormat } from "@/lib/export";
import { fadeUp } from "@/lib/motion";
import {
  formatDate,
  formatCurrency,
  getInitials,
  recoveryStatusLabel,
  riskLabel,
  rowActionClass,
} from "@/lib/utils";
import type { AdminRole, CustomerWithDue, Paginated, RecoveryStatus, RiskLevel } from "@/types";

const PAGE_SIZE = 10;
const SKELETON_ROWS = 6;

const FILTER_LABEL =
  "font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground";

const DANGEROUS = "hover:text-destructive hover:ring-destructive/30";

export function CustomersView({ role }: { role: AdminRole }) {
  const [data, setData] = useState<Paginated<CustomerWithDue> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [riskLevel, setRiskLevel] = useState<"" | RiskLevel>("");
  const [recoveryStatus, setRecoveryStatus] = useState<"" | RecoveryStatus>("");
  const [showTrash, setShowTrash] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerWithDue | null>(null);
  const [deleting, setDeleting] = useState<CustomerWithDue | null>(null);
  const [purging, setPurging] = useState<CustomerWithDue | null>(null);

  const filtersActive = riskLevel !== "" || recoveryStatus !== "";

  useEffect(() => {
    let cancelled = false;
    // Skeletons only on the first load - refetches (search/page/reload) keep
    // the current rows on screen instead of flashing.
    api
      .listCustomers({
        search: debouncedQuery.trim() || undefined,
        riskLevel: riskLevel || undefined,
        recoveryStatus: recoveryStatus || undefined,
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
  }, [debouncedQuery, riskLevel, recoveryStatus, showTrash, page, reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);
  const rows = data?.items ?? [];
  const searching = debouncedQuery.trim().length > 0 || filtersActive;

  /** Export walks every page of the CURRENT search scope (FR-9b). */
  async function handleExport(format: ExportFormat): Promise<string> {
    const all: CustomerWithDue[] = [];
    let exportPage = 1;
    for (;;) {
      const result = await api.listCustomers({
        search: debouncedQuery.trim(),
        riskLevel: riskLevel || undefined,
        recoveryStatus: recoveryStatus || undefined,
        page: exportPage,
        limit: 100,
      });
      all.push(...result.items);
      if (exportPage >= result.totalPages) break;
      exportPage += 1;
    }
    return downloadExport(format, "lendbook-customers", customerExportColumns(), all);
  }

  async function handleRestore(row: CustomerWithDue) {
    try {
      const { transactionsRestored } = await api.restoreCustomer(row.id);
      toast.success("Customer restored", {
        description:
          transactionsRestored > 0
            ? `${row.name} and ${transactionsRestored} transaction${
                transactionsRestored > 1 ? "s" : ""
              } are back in the ledger.`
            : `${row.name} is back in the ledger.`,
      });
      reload();
    } catch (error) {
      toast.error("Couldn't restore that customer.", { description: errorMessage(error) });
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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1); // new search starts from the first page
              }}
              placeholder="Search code, name, phone, area…"
              className="pl-8"
              aria-label="Search customers"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
              {loading
                ? "…"
                : showTrash
                  ? `${data?.total ?? 0} in trash`
                  : `${data?.total ?? 0} customer${data?.total === 1 ? "" : "s"}`}
            </p>
            {!showTrash && (
              <ExportMenu
                onExport={handleExport}
                disabled={loading || (data?.total ?? 0) === 0}
              />
            )}
            {!showTrash && (
              <Button onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
                Add customer
              </Button>
            )}
          </div>
        </div>

        {/* Filters + trash toggle */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-36">
            <span className={FILTER_LABEL}>Risk level</span>
            <Select
              value={riskLevel || "any"}
              onValueChange={(v) => {
                setRiskLevel(v === "any" ? "" : (v as RiskLevel));
                setPage(1);
              }}
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
              onValueChange={(v) => {
                setRecoveryStatus(v === "any" ? "" : (v as RecoveryStatus));
                setPage(1);
              }}
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

          <label className="flex items-center gap-2.5 pb-1.5">
            <Switch
              id="customers-show-trash"
              checked={showTrash}
              onCheckedChange={(checked) => {
                setShowTrash(checked);
                setPage(1);
              }}
            />
            <Label htmlFor="customers-show-trash" className="text-xs text-muted-foreground">
              Show trash
            </Label>
          </label>

          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-1.5"
              onClick={() => {
                setRiskLevel("");
                setRecoveryStatus("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="flex flex-col items-center gap-2 border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load customers.</p>
          <p className="max-w-xs text-xs text-muted-foreground">{loadError}</p>
          <Button variant="outline" className="mt-2" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {/* Table card */}
      {!loadError && (
      <Card className="gap-0 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Lent</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Received</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="hidden lg:table-cell">
                {showTrash ? "Trashed" : "Last activity"}
              </TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2 w-16" />
                        </div>
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
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-7 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.id} className={showTrash ? "opacity-75" : undefined}>
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
                            <span className="truncate text-xs font-medium group-hover:underline">
                              {row.name}
                            </span>
                          </span>
                          <span className="text-[0.625rem] text-muted-foreground">
                            since {formatDate(row.createdAt)}
                          </span>
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
                      {showTrash
                        ? row.deletedAt
                          ? `trashed ${formatDate(row.deletedAt)}`
                          : "-"
                        : row.lastTransactionDate
                          ? formatDate(row.lastTransactionDate)
                          : "-"}
                    </TableCell>
                    <TableCell>
                      {showTrash ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            className={rowActionClass}
                            aria-label={`Restore ${row.name}`}
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
                              aria-label={`Permanently delete ${row.name}`}
                              onClick={() => setPurging(row)}
                            >
                              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" className={rowActionClass} aria-label={`View ${row.name}`}>
                            <Link href={`/dashboard/customers/${row.id}`}>
                              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            className={rowActionClass}
                            aria-label={`Edit ${row.name}`}
                            onClick={() => setEditing(row)}
                          >
                            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                          </Button>
                          <Button
                            variant="ghost"
                            className={`${rowActionClass} ${DANGEROUS}`}
                            aria-label={`Move ${row.name} to trash`}
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
                : searching
                  ? "No customers match that search."
                  : "No customers yet."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {showTrash
                ? "Deleted customers wait here until a super admin removes them for good."
                : searching
                  ? "Try a different name, phone number or area."
                  : "Add your first customer - a name and phone number is enough to start a ledger."}
            </p>
            {!searching && !showTrash && (
              <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
                <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
                Add customer
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
      )}

      {/* Dialogs */}
      {!showTrash && (
        <>
          <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={reload} />
          <CustomerFormDialog
            open={Boolean(editing)}
            onOpenChange={(open) => !open && setEditing(null)}
            customer={editing}
            onSaved={reload}
          />
        </>
      )}
      <DeleteCustomerDialog
        customer={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={reload}
      />
      <DeleteCustomerDialog
        customer={purging}
        purge
        onOpenChange={(open) => !open && setPurging(null)}
        onDeleted={reload}
      />
    </motion.div>
  );
}
