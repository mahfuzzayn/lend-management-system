"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowTurnBackwardIcon,
  Call02Icon,
  Copy01Icon,
  Delete01Icon,
  Download04Icon,
  Edit01Icon,
  LeftToRightListBulletIcon,
  Mail01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { downloadCustomerHistoryPdf } from "@/components/pdf/download-customer-history-pdf";
import { DueBadge } from "@/components/shared/due-badge";
import { ExportMenu } from "@/components/shared/export-menu";
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
import { GranularityToggle } from "@/components/dashboard/charts/chart-bits";
import { METHOD_FILL } from "@/components/dashboard/charts/fills";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { downloadExport, downloadJsonFile, type ExportColumn, type ExportFormat } from "@/lib/export";
import { flowSeries, methodMix } from "@/lib/domain";
import { staggerItem, staggerParent } from "@/lib/motion";
import {
  businessTypeLabel,
  cn,
  formatCurrency,
  formatDate,
  getInitials,
  methodLabel,
  recoveryStatusLabel,
  riskLabel,
} from "@/lib/utils";
import type { AdminRole, CustomerDetail, FlowGranularity, TransactionWithBalance } from "@/types";

// Insight charts are code-split + client-only (FR-6.6) - the detail page's
// own payload already holds everything they need.
const FlowChart = dynamic(
  () => import("@/components/dashboard/charts/flow-chart").then((m) => m.FlowChart),
  { ssr: false }
);
const MixDonut = dynamic(
  () => import("@/components/dashboard/charts/mix-donut").then((m) => m.MixDonut),
  { ssr: false }
);
const CollectionBar = dynamic(
  () => import("@/components/dashboard/charts/collection-bar").then((m) => m.CollectionBar),
  { ssr: false }
);

type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "not-found" }
  | { phase: "ready"; data: CustomerDetail };

/**
 * One contact row (works.md #3): the value is a link that hands off to the
 * calling or mail app (tel:/mailto:), with a copy button beside it so the
 * number or address can go straight to the clipboard.
 */
function ContactRow({
  icon,
  href,
  value,
  copyLabel,
}: {
  icon: typeof Call02Icon;
  href: string;
  value: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
      toast.success(`${copyLabel} copied.`, { description: value });
    } catch {
      toast.error("Couldn't copy.", { description: "Select the text and copy it manually." });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border bg-muted/40 text-muted-foreground">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
      </span>
      <a
        href={href}
        className="min-w-0 flex-1 wrap-break-word font-mono text-xs underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {value}
      </a>
      <Button
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        onClick={() => {
          void copy();
        }}
        aria-label={`Copy ${copyLabel.toLowerCase()}`}
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          strokeWidth={2}
          className={cn("size-3", copied && "text-emerald-600")}
        />
      </Button>
    </div>
  );
}

/** tel: hrefs carry digits (and a leading +) only - no spaces or dashes. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function CustomerDetailView({
  customerId,
  role,
}: {
  customerId: string;
  role: AdminRole;
}) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [reloadNonce, setReloadNonce] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [chartGranularity, setChartGranularity] = useState<FlowGranularity>("month");

  // Chart inputs stay hook-safe for the early-return phases below.
  const ledgerForCharts = useMemo(
    () => (state.phase === "ready" ? state.data.transactions : []),
    [state]
  );
  const flow = useMemo(
    () => flowSeries(ledgerForCharts, chartGranularity),
    [ledgerForCharts, chartGranularity]
  );
  const methodSlices = useMemo(
    () =>
      methodMix(ledgerForCharts).map((slice) => ({
        key: slice.key,
        label: methodLabel(slice.key),
        count: slice.count,
        secondary: slice.amount,
      })),
    [ledgerForCharts]
  );

  useEffect(() => {
    let cancelled = false;
    // The "loading" phase only occurs on first mount; reloads after a mutation
    // keep the current data on screen until the fresh payload lands.
    api
      .getCustomer(customerId)
      .then((data) => {
        if (!cancelled) setState({ phase: "ready", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiClientError && error.status === 404) {
          setState({ phase: "not-found" });
        } else {
          setState({ phase: "error", message: errorMessage(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);

  if (state.phase === "loading") {
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

  if (state.phase === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm font-medium text-destructive">Couldn&apos;t load this customer.</p>
        <p className="max-w-xs text-xs text-muted-foreground">{state.message}</p>
        <Button variant="outline" className="mt-2" onClick={reload}>
          Try again
        </Button>
      </div>
    );
  }

  if (state.phase === "not-found") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg border">
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

  const detail = state.data;
  const { customer, summary, transactions: ledger } = detail;
  const trashed = Boolean(customer.deletedAt);

  async function handleRestore() {
    setRestoring(true);
    try {
      const { transactionsRestored } = await api.restoreCustomer(customer.id);
      toast.success("Customer restored", {
        description:
          transactionsRestored > 0
            ? `${customer.name} and ${transactionsRestored} transaction${
                transactionsRestored > 1 ? "s" : ""
              } are back in the ledger.`
            : `${customer.name} is back in the ledger.`,
      });
      reload();
    } catch (error) {
      toast.error("Couldn't restore that customer.", { description: errorMessage(error) });
    } finally {
      setRestoring(false);
    }
  }

  /** CSV = the ledger rows (spreadsheet-shaped); JSON = the full payload. */
  const ledgerColumns: ExportColumn<TransactionWithBalance>[] = [
    { header: "Customer Code", value: () => customer.customerCode ?? "" },
    { header: "Customer Name", value: () => customer.name },
    { header: "Reference", value: (t) => t.referenceCode ?? "" },
    { header: "Date", value: (t) => t.date.slice(0, 10) },
    { header: "Type", value: (t) => (t.type === "lend" ? "Credit" : "Payment") },
    { header: "Method", value: (t) => methodLabel(t.method) },
    { header: "Description", value: (t) => t.note ?? "" },
    { header: "Added By", value: (t) => t.addedBy ?? "" },
    {
      header: "Amount",
      value: (t) => (t.type === "lend" ? -t.amount : t.amount),
    },
    { header: "Balance", value: (t) => t.balance },
  ];

  function handleExport(format: ExportFormat): string {
    const basename = `lendbook-${(customer.customerCode ?? customer.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-history`;
    if (format === "json") {
      return downloadJsonFile(basename, detail);
    }
    return downloadExport(format, basename, ledgerColumns, ledger);
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

      {trashed && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-amber-900">
            This customer is in the trash - restored ledger math excludes them
            {role === "super-admin"
              ? ". Permanent delete lives in the Customers trash view."
              : ". A super admin can remove them permanently."}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={restoring}
            onClick={() => {
              void handleRestore();
            }}
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} data-icon="inline-start" />
            {restoring ? "Restoring…" : "Restore"}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:items-start">
        {/* Profile */}
        <motion.div variants={staggerItem} className="flex min-w-0 flex-col gap-4">
          <Card className="gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                {getInitials(customer.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {customer.customerCode && (
                    <Badge variant="outline" className="font-mono uppercase tracking-wider">
                      {customer.customerCode}
                    </Badge>
                  )}
                  <h2 className="text-base font-semibold tracking-tight">{customer.name}</h2>
                  {customer.status === "archived" && (
                    <Badge variant="outline" className="font-mono uppercase">
                      archived
                    </Badge>
                  )}
                </div>
                {customer.businessName && customer.businessName !== customer.name && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {customer.businessName}
                  </p>
                )}
                {(customer.riskLevel || customer.recoveryStatus) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customer.riskLevel && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[0.625rem] uppercase tracking-wider",
                          customer.riskLevel === "critical" && "border-red-200 text-red-700",
                          customer.riskLevel === "high" && "border-orange-200 text-orange-700",
                          customer.riskLevel === "medium" && "border-amber-200 text-amber-700"
                        )}
                      >
                        risk · {riskLabel(customer.riskLevel)}
                      </Badge>
                    )}
                    {customer.recoveryStatus && (
                      <Badge variant="outline" className="font-mono text-[0.625rem] uppercase tracking-wider">
                        {recoveryStatusLabel(customer.recoveryStatus)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact (works.md #3) - phones dial, e-mail composes, copy is
                one click. Kept visually loud: icon chip + link + button. */}
            {customer.phone || customer.alternativePhone || customer.email ? (
              <div className="flex flex-col gap-1.5 border-t pt-4">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                  Contact
                </p>
                {customer.phone && (
                  <ContactRow
                    icon={Call02Icon}
                    href={telHref(customer.phone)}
                    value={customer.phone}
                    copyLabel="Phone number"
                  />
                )}
                {customer.alternativePhone && (
                  <ContactRow
                    icon={Call02Icon}
                    href={telHref(customer.alternativePhone)}
                    value={customer.alternativePhone}
                    copyLabel="Alternative phone"
                  />
                )}
                {customer.email && (
                  <ContactRow
                    icon={Mail01Icon}
                    href={`mailto:${customer.email}`}
                    value={customer.email}
                    copyLabel="E-mail address"
                  />
                )}
              </div>
            ) : (
              <p className="border-t pt-4 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                No contact on file
              </p>
            )}

            <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 border-t pt-4 text-xs">
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Address
              </dt>
              <dd className="wrap-break-word">{customer.address ?? "-"}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Area
              </dt>
              <dd className="wrap-break-word">{customer.area ?? "-"}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Business
              </dt>
              <dd>{customer.businessType ? businessTypeLabel(customer.businessType) : "-"}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Since
              </dt>
              <dd>{formatDate(customer.customerSince ?? customer.createdAt)}</dd>
              <dt className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Notes
              </dt>
              <dd className="wrap-break-word text-muted-foreground">{customer.notes ?? "-"}</dd>
            </dl>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => setAddTxOpen(true)} disabled={trashed}>
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
              <ExportMenu onExport={handleExport} disabled={ledger.length === 0} />
              <Button variant="outline" onClick={() => setEditOpen(true)} disabled={trashed}>
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} data-icon="inline-start" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
                disabled={trashed}
              >
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </Card>

          {/* Summary tiles - one per row on phones, three up from sm (F14). */}
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            <Card size="sm" className="min-w-0 gap-1">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Lent
              </p>
              <p className="truncate font-mono text-xs font-semibold tabular-nums sm:text-sm">
                {formatCurrency(summary.totalLent)}
              </p>
            </Card>
            <Card size="sm" className="min-w-0 gap-1">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Received
              </p>
              <p className="truncate font-mono text-xs font-semibold tabular-nums sm:text-sm">
                {formatCurrency(summary.totalReceived)}
              </p>
            </Card>
            <Card size="sm" className="min-w-0 gap-1.5">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Due
              </p>
              <DueBadge due={summary.due} dueStatus={summary.dueStatus} className="w-fit" />
            </Card>
          </div>
        </motion.div>

        {/* Ledger - min-w-0 lets the card shrink so the table scrolls inside
            its own overflow-x container instead of pushing the page wide (F14). */}
        <motion.div variants={staggerItem} className="min-w-0">
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
                  <TableHead className="hidden xl:table-cell">Added by</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                      No transactions yet - record the first lend or repayment.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(row.date)}</TableCell>
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
                        {row.addedBy ?? "-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "whitespace-nowrap text-right font-mono text-xs tabular-nums",
                          row.type === "repayment" && "text-emerald-600"
                        )}
                      >
                        {formatCurrency(row.type === "lend" ? -row.amount : row.amount, {
                          signed: true,
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-xs font-medium tabular-nums">
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {ledger.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                      totals
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs tabular-nums">
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

      {/* Insight charts (FR-6.6) - computed client-side from the ledger. */}
      {ledger.length > 0 && (
        <motion.div variants={staggerItem} className="flex min-w-0 flex-col gap-4">
          <Card className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold">Money out &amp; in</p>
                <p className="text-[0.625rem] text-muted-foreground">
                  {customer.name}&apos;s lends vs repayments per {chartGranularity}
                </p>
              </div>
              <GranularityToggle value={chartGranularity} onChange={setChartGranularity} />
            </div>
            {flow.length > 0 ? (
              <FlowChart data={flow} />
            ) : (
              <p className="py-10 text-center text-xs text-muted-foreground">
                Nothing in this window yet.
              </p>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="h-full gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold">Payment methods</p>
                <p className="text-[0.625rem] text-muted-foreground">
                  entries by how the money moved
                </p>
              </div>
              {methodSlices.length > 0 ? (
                <MixDonut
                  data={methodSlices}
                  fillFor={(key) => METHOD_FILL[key] ?? "var(--chart-4)"}
                  formatSecondary={(slice) => `${formatCurrency(slice.secondary)} total`}
                  centerWord="entries"
                />
              ) : (
                <p className="py-10 text-center text-xs text-muted-foreground">No entries yet.</p>
              )}
            </Card>

            <Card className="h-full gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold">Collection progress</p>
                <p className="text-[0.625rem] text-muted-foreground">
                  what {customer.name} has repaid of everything lent
                </p>
              </div>
              <CollectionBar summary={summary} />
            </Card>
          </div>
        </motion.div>
      )}

      {/* Dialogs */}
      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSaved={reload}
      />
      <DeleteCustomerDialog
        customer={deleteOpen ? customer : null}
        transactionCount={ledger.length}
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
        onSaved={reload}
      />
    </motion.div>
  );
}
