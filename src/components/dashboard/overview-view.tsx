"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowRight01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";;

import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import { EASE_OUT, staggerItem, staggerParent } from "@/lib/motion";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { OverviewStats } from "@/types";

/** Animated number that counts up to `value` (respects reduced motion). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (v) => format(Math.round(v)));

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: EASE_OUT });
    return () => controls.stop();
  }, [value, motionValue, reduced]);

  return <motion.span>{text}</motion.span>;
}

function greetingFor(hour: number) {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function OverviewView() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Skeletons only on the first load - reloads keep the current stats up.
    api
      .overview()
      .then((result) => {
        if (cancelled) return;
        setStats(result);
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
  }, [reloadNonce]);

  const reload = () => setReloadNonce((n) => n + 1);

  const now = new Date();
  const greeting = greetingFor(now.getHours());

  const STAT_CARDS = stats
    ? [
        {
          label: "Total customers",
          value: stats.totalCustomers,
          format: (n: number) => String(n),
          sub: `${stats.recentTransactions.length > 0 ? "ledger active" : "ledger empty"}`,
          accent: "text-foreground",
        },
        {
          label: "Total lent",
          value: stats.totalLent,
          format: (n: number) => formatCurrency(n),
          sub: "money given out",
          accent: "text-foreground",
        },
        {
          label: "Total collected",
          value: stats.totalCollected,
          format: (n: number) => formatCurrency(n),
          sub: "repayments received",
          accent: "text-emerald-600",
        },
        {
          label: "Outstanding due",
          value: stats.totalOutstanding,
          format: (n: number) => formatCurrency(n),
          sub: stats.totalOutstanding > 0 ? "yet to collect" : "all square",
          accent: stats.totalOutstanding > 0 ? "text-red-600" : "text-emerald-600",
        },
      ]
    : [];

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {/* Greeting + quick actions */}
      <motion.div variants={staggerItem} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
            {formatDate(now)} · overview
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {greeting}, Admin.
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddCustomerOpen(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
          <Button onClick={() => setAddTransactionOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            Add transaction
          </Button>
        </div>
      </motion.div>

      {loadError && !loading && (
        <div className="flex flex-col items-center gap-2 border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load the overview.</p>
          <p className="max-w-xs text-xs text-muted-foreground">{loadError}</p>
          <Button variant="outline" className="mt-2" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading
          ? STAT_CARDS.map((card) => (
              <Card key={card.label} className="gap-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-2 w-20" />
              </Card>
            ))
          : STAT_CARDS.map((card) => (
              <motion.div key={card.label} variants={staggerItem}>
                <Card className="h-full gap-2">
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={cn("font-mono text-xl font-semibold tabular-nums tracking-tight", card.accent)}>
                    <CountUp value={card.value} format={card.format} />
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">{card.sub}</p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Recent activity + top dues */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Recent transactions */}
        <motion.div variants={staggerItem}>
          <Card className="h-full gap-0 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-xs font-semibold">Recent activity</p>
              <Button asChild variant="ghost" size="xs">
                <Link href="/dashboard/transactions">
                  View all
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                </Link>
              </Button>
            </div>
            <div className="divide-y">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : (stats?.recentTransactions ?? []).length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-xs text-muted-foreground">
                        Nothing recorded yet - the first entry starts the ledger.
                      </p>
                    </div>
                  )
                : (stats?.recentTransactions ?? []).map((t) => (
                    <Link
                      key={t.id}
                      href={`/dashboard/customers/${t.customerId}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{t.customerName}</p>
                        <p className="text-[0.625rem] text-muted-foreground">
                          {formatDate(t.date)} · {t.method === "mobile-banking" ? "mobile banking" : t.method}
                          {t.note ? ` · ${t.note}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "hidden font-mono uppercase sm:inline-flex",
                            t.type === "lend"
                              ? "border-red-200 text-red-700"
                              : "border-emerald-200 text-emerald-700"
                          )}
                        >
                          {t.type}
                        </Badge>
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            t.type === "repayment" ? "text-emerald-600" : "text-foreground"
                          )}
                        >
                          {formatCurrency(t.type === "lend" ? -t.amount : t.amount, { signed: true })}
                        </span>
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>
        </motion.div>

        {/* Top dues */}
        <motion.div variants={staggerItem}>
          <Card className="h-full gap-0 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-xs font-semibold">Top dues</p>
              <Button asChild variant="ghost" size="xs">
                <Link href="/dashboard/dues">
                  View all
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                </Link>
              </Button>
            </div>
            <div className="divide-y">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="size-7" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))
                : (stats?.topDues ?? []).length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-xs text-muted-foreground">
                        No outstanding dues - everyone&apos;s square.
                      </p>
                    </div>
                  )
                : (stats?.topDues ?? []).map((c, index) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/customers/${c.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="font-mono text-[0.625rem] text-muted-foreground/60">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex size-7 shrink-0 items-center justify-center bg-muted text-[0.5625rem] font-semibold">
                          {getInitials(c.name)}
                        </span>
                        <span className="truncate text-xs font-medium">{c.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-red-600">
                        {formatCurrency(c.due)}
                      </span>
                    </Link>
                  ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Dialogs */}
      <CustomerFormDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onSaved={reload} />
      <TransactionFormDialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen} onSaved={reload} />
    </motion.div>
  );
}
