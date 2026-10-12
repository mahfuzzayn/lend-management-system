import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Admin sign in - one ledger, one login.",
};

function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
      <Logo inverted={inverted} />
      <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}

export default async function LoginPage() {
  // Already signed in? Straight to the dashboard (FR-2.3).
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && verifySessionToken(token)) {
    redirect("/dashboard");
  }

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[oklch(0.55_0.095_173)] via-[oklch(0.46_0.086_178)] to-[oklch(0.375_0.072_185)] p-10 text-primary-foreground lg:flex">
        <Wordmark inverted />

        <div className="flex flex-col gap-5">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-primary-foreground/60">
            Private lend management
          </p>
          <p className="max-w-md text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.02em] xl:text-5xl">
            Every taka,
            <br />
            accounted for.
          </p>
        </div>

        <ul className="flex flex-col gap-2 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-primary-foreground/70">
          <li className="flex items-center gap-2">
            <span className="size-1 bg-primary-foreground/50" aria-hidden />Single admin
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 bg-primary-foreground/50" aria-hidden />Dues derived, never entered
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1 bg-primary-foreground/50" aria-hidden />One-file PDF history
          </li>
        </ul>

        {/* quiet ledger-grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
          aria-hidden
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-8 p-6 sm:p-10">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex justify-center lg:hidden">
            <Wordmark />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin access only - one ledger, one login.
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <Link
            href="/"
            className="text-center font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
