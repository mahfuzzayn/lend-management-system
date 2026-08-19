"use client";

import { useEffect, useMemo, useState } from "react";
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
import { customersWithDue } from "@/lib/domain";
import { useMockStore } from "@/lib/mock-store";
import { fadeUp } from "@/lib/motion";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";
import type { CustomerWithDue } from "@/types";

const PAGE_SIZE = 10;
const SKELETON_ROWS = 6;

export function CustomersView() {
  const { customers, transactions } = useMockStore();

  // v1: simulate the request latency the v1 skeletons are designed for.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [page, setPage] = useState({ search: "", index: 1 });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerWithDue | null>(null);
  const [deleting, setDeleting] = useState<CustomerWithDue | null>(null);

  const rows = useMemo(
    () =>
      customersWithDue(
        customers.filter((c) => c.status === "active"),
        transactions
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [customers, transactions]
  );

  const normalized = debouncedQuery.trim().toLowerCase();
  const filtered = normalized
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(normalized) || r.phone.toLowerCase().includes(normalized)
      )
    : rows;

  // Page is scoped to the current search: changing the search derives page 1
  // without an effect (page state remembers which search it belongs to).
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage =
    page.search === normalized ? Math.min(page.index, pageCount) : 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(index: number) {
    setPage({ search: normalized, index });
  }

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
            aria-label="Search customers"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
            {loading ? "…" : `${filtered.length} customer${filtered.length === 1 ? "" : "s"}`}
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
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
              : paginated.map((row) => (
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
        {!loading && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-14 text-center">
            <p className="text-sm font-medium">
              {normalized ? "No customers match that search." : "No customers yet."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {normalized
                ? "Try a different name or phone number."
                : "Add your first customer - a name and phone number is enough to start a ledger."}
            </p>
            {!normalized && (
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
      <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CustomerFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        customer={editing}
      />
      <DeleteCustomerDialog
        customer={deleting}
        transactionCount={
          deleting
            ? transactions.filter((t) => t.customerId === deleting.id).length
            : 0
        }
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </motion.div>
  );
}
