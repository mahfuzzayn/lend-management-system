"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  Delete01Icon,
  Download04Icon,
  Edit01Icon,
  LeftToRightListBulletIcon,
} from "@hugeicons/core-free-icons";

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { downloadCustomerHistoryPdf } from "@/components/pdf/download-customer-history-pdf";
import { DueBadge } from "@/components/shared/due-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerSummary, withRunningBalance } from "@/lib/domain";
import { useMockStore } from "@/lib/mock-store";
import { staggerItem, staggerParent } from "@/lib/motion";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { customers, transactions } = useMockStore();

  // v1: simulated request latency for the skeleton pass.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const ownTransactions = useMemo(
    () => transactions.filter((t) => t.customerId === customerId),
    [transactions, customerId]
  );
  const ledger = useMemo(() => withRunningBalance(ownTransactions), [ownTransactions]);
  const summary = useMemo(() => customerSummary(ownTransactions), [ownTransactions]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-10 items-center justify-center border">
          <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={1.75} className="size-4.5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-medium">Customer not found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            They may have been deleted - the ledger no longer has this record.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/dashboard/customers">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
            Back to customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <div>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3" />
          Customers
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-start">
        {/* Profile */}
        <motion.div variants={staggerItem} className="flex flex-col gap-4">
          <Card className="gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center bg-muted text-sm font-semibold">
                {getInitials(customer.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight">{customer.name}</h2>
                  {customer.status === "archived" && (
                    <Badge variant="outline" className="font-mono uppercase">
                      archived
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{customer.phone}</p>
              </div>
            </div>

            <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 border-t pt-4 text-xs">
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                E-mail
              </dt>
              <dd className="truncate">{customer.email ?? "-"}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Address
              </dt>
              <dd>{customer.address ?? "-"}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Since
              </dt>
              <dd>{formatDate(customer.createdAt)}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Notes
              </dt>
              <dd className="text-muted-foreground">{customer.notes ?? "-"}</dd>
            </dl>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => setAddTxOpen(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                Add transaction
              </Button>
              <Button
                variant="outline"
                disabled={pdfPending}
                onClick={() => {
                  setPdfPending(true);
                  void downloadCustomerHistoryPdf({ customer, summary, ledger })
                    .catch(() => undefined)
                    .finally(() => setPdfPending(false));
                }}
              >
                <HugeiconsIcon icon={Download04Icon} strokeWidth={2} data-icon="inline-start" />
                {pdfPending ? "Preparing…" : "Download PDF"}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} data-icon="inline-start" />
                Edit
              </Button>
              <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </Card>

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4">
            <Card size="sm" className="gap-1">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Lent
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(summary.totalLent)}
              </p>
            </Card>
            <Card size="sm" className="gap-1">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Received
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(summary.totalReceived)}
              </p>
            </Card>
            <Card size="sm" className="gap-1.5">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Due
              </p>
              <DueBadge due={summary.due} dueStatus={summary.dueStatus} className="w-fit" />
            </Card>
          </div>
        </motion.div>

        {/* Ledger */}
        <motion.div variants={staggerItem}>
          <Card className="gap-0 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-xs font-semibold">Transaction history</p>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                {ledger.length} entr{ledger.length === 1 ? "y" : "ies"}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="hidden lg:table-cell">Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                      No transactions yet - record the first lend or repayment.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">{formatDate(row.date)}</TableCell>
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
                        {formatCurrency(row.type === "lend" ? -row.amount : row.amount, {
                          signed: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium tabular-nums">
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {ledger.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                      totals
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      <span className="text-emerald-600">
                        +{formatCurrency(summary.totalReceived)}
                      </span>{" "}
                      <span className="text-muted-foreground">/</span>{" "}
                      <span>−{formatCurrency(summary.totalLent)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DueBadge due={summary.due} dueStatus={summary.dueStatus} />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </Card>
        </motion.div>
      </div>

      {/* Dialogs */}
      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />
      <DeleteCustomerDialog
        customer={deleteOpen ? customer : null}
        transactionCount={ownTransactions.length}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          toast.info("Returning to the customer list.");
          router.push("/dashboard/customers");
        }}
      />
      <TransactionFormDialog
        open={addTxOpen}
        onOpenChange={setAddTxOpen}
        fixedCustomer={customer}
      />
    </motion.div>
  );
}
