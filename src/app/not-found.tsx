import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

/**
 * Global 404 (FR-14): catches every unmatched URL inside the root layout.
 * Editorial like the landing pages - oversized type, hairline rules, and a
 * calm way back home.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2.5 px-4 sm:px-6">
          <Logo className="size-6" />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-muted-foreground">
          Page not found
        </p>
        <p
          aria-hidden
          className="mt-6 bg-linear-to-br from-(--grad-from) to-(--grad-to) bg-clip-text font-mono text-[6rem] font-semibold leading-none tracking-tighter text-transparent sm:text-[10rem]"
        >
          404
        </p>
        <h1 className="mt-6 max-w-md text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          This page owes you nothing - it doesn&apos;t exist.
        </h1>
        <p className="mt-3 max-w-sm text-xs/relaxed text-muted-foreground sm:text-sm/relaxed">
          The link may be old, or the page moved. Your customers, ledger, and
          dues are all still exactly where you left them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/overview">Go to dashboard</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
            {APP_NAME}
          </p>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-muted-foreground">
            error 404 · not found
          </p>
        </div>
      </footer>
    </main>
  );
}
