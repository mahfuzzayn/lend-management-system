"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSignedIn } from "@/hooks/use-signed-in";
import { DURATION, EASE_OUT, fadeUpLg, staggerItem, staggerParent } from "@/lib/motion";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";

/** Miniature product artifact - real ledger data, formatted by the real utils. */
const LEDGER_ROWS = [
  { id: 1, date: "2026-07-04", label: "Lend", method: "cash", amount: -12000, balance: 12000 },
  { id: 2, date: "2026-07-18", label: "Repayment", method: "mobile banking", amount: 5000, balance: 7000 },
  { id: 3, date: "2026-08-12", label: "Repayment", method: "cash", amount: 2500, balance: 4500 },
] as const;

export function Hero() {
  const signedIn = useSignedIn();

  return (
    <section className="border-b">
      <Container className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-6"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3">
            <span className="h-px w-10 bg-foreground/40" aria-hidden />
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-muted-foreground">
              Private lend management
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUpLg}
            className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-7xl"
          >
            Know exactly who{" "}
            <span className="rounded-xs bg-primary px-3 text-primary-foreground">owes</span> you.
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="max-w-lg text-sm/relaxed text-muted-foreground sm:text-base/relaxed"
          >
            A single-admin ledger for people who lend money. Record every lend and repayment
            once - each customer&apos;s due, full history, and one-tap PDF keeps itself.
          </motion.p>

          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={signedIn ? "/dashboard/overview" : "/login"}>
                {signedIn ? "Open dashboard" : "Sign in to dashboard"}
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </motion.div>

          <motion.ul
            variants={staggerItem}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground"
          >
            <li className="flex items-center gap-2">
              <span className="size-1 bg-foreground/50" aria-hidden />৳ BDT ledger
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-foreground/50" aria-hidden />Single admin
            </li>
            <li className="flex items-center gap-2">
              <span className="size-1 bg-foreground/50" aria-hidden />One-file PDF history
            </li>
          </motion.ul>
        </motion.div>

        {/* Ledger artifact - the product, in miniature */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT, delay: 0.2 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <Card className="gap-0 p-0 shadow-xl shadow-foreground/5">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center bg-muted text-xs font-semibold">
                  {getInitials("Rahim Store")}
                </span>
                <div>
                  <p className="text-xs font-semibold">Rahim Store</p>
                  <p className="text-[0.625rem] text-muted-foreground">+880 1712-458900</p>
                </div>
              </div>
              <Badge variant="destructive">Due {formatCurrency(4500)}</Badge>
            </div>

            <div className="divide-y">
              {LEDGER_ROWS.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-xs font-medium">{row.label}</p>
                    <p className="text-[0.625rem] text-muted-foreground">
                      {formatDate(row.date)} · {row.method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        row.amount < 0 ? "text-foreground" : "text-emerald-600"
                      )}
                    >
                      {formatCurrency(row.amount, { signed: true })}
                    </p>
                    <p className="font-mono text-[0.625rem] text-muted-foreground tabular-nums">
                      bal {formatCurrency(row.balance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t bg-muted/50 p-4">
              <p className="text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
                Current due
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(4500)}
              </p>
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT, delay: 0.5 }}
            className="absolute -bottom-7 -left-7 hidden -rotate-3 sm:block"
          >
            <Card size="sm" className="w-52 shadow-lg shadow-foreground/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center bg-muted text-[0.5rem] font-semibold">
                    {getInitials("Nusrat Jahan")}
                  </span>
                  <p className="text-[0.625rem] font-medium">Nusrat Jahan</p>
                </div>
                <Badge className="bg-emerald-600 text-white">Settled</Badge>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
