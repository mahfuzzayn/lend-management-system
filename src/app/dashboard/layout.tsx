"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useMockSession } from "@/lib/auth-mock";

/**
 * Client-side auth guard + shell for every /dashboard route (v1 mock - see
 * requirements FR-2.2). v2 replaces the guard with `proxy.ts` + cookie sessions.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useMockSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session === "guest") {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [session, pathname, router]);

  if (session !== "authed") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3">
        <Spinner className="size-5 text-muted-foreground" />
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          Checking session
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <Sidebar />
      <div className="flex min-h-svh flex-col lg:pl-60">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
