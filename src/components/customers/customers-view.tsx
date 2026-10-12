"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Delete01Icon,
  Edit01Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";
import { DueBadge } from "@/components/shared/due-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { fadeUp } from "@/lib/motion";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { CustomerWithDue, Paginated } from "@/types";

const PAGE_SIZE = 10;
const SKELETON_ROWS = 6;

export function CustomersView() {
  const [data, setData] = useState<Paginated<CustomerWithDue> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerWithDue | null>(null);
  const [deleting, setDeleting] = useState<CustomerWithDue | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Skeletons only on the first load - refetches (search/page/reload) keep
    // the current rows on screen instead of flashing.
    api
      .listCustomers({ search: debouncedQuery.trim(), page, limit: PAGE_SIZE })
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
  }, [debouncedQuery, page, reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);
  const rows = data?.items ?? [];
  const searching = debouncedQuery.trim().length > 0;

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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // new search starts from the first page
            }}
            placeholder="Search name or phone…"
            className="pl-8"
            aria-label="Search customers"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
            {loading ? "…" : `${data?.total ?? 0} customer${data?.total === 1 ? "" : "s"}`}
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
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
              <TableHead className="hidden lg:table-cell">Last activity</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
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
                      <Skeleton className="ml-auto h-6 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/customers/${row.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center bg-muted text-[0.625rem] font-semibold">
                          {getInitials(row.name)}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-xs font-medium group-hover:underline">
                            {row.name}
                          </span>
                          <span className="text-[0.625rem] text-muted-foreground">
                            since {formatDate(row.createdAt)}
                          </span>
                        </span>
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
                          aria-label={`Edit ${row.name}`}
                          onClick={() => setEditing(row)}
                        >
                          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${row.name}`}
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
              {searching ? "No customers match that search." : "No customers yet."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {searching
                ? "Try a different name or phone number."
                : "Add your first customer - a name and phone number is enough to start a ledger."}
            </p>
            {!searching && (
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
      <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={reload} />
      <CustomerFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        customer={editing}
        onSaved={reload}
      />
      <DeleteCustomerDialog
        customer={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={reload}
      />
    </motion.div>
  );
}
