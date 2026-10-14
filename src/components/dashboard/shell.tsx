"use client";

import { useState } from "react";

import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";

/**
 * Dashboard shell (v2). Protection is server-side: src/proxy.ts verifies the
 * session cookie and redirects unauthenticated visits to /login before any
 * dashboard HTML renders - no client-side guard needed.
 *
 * Owns the desktop sidebar collapse state (works.md F22) so the sidebar and
 * the content padding animate together. Session-only on purpose: no storage
 * round-trip, no hydration guesswork.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((next) => !next)} />
      <div
        className={cn(
          "flex min-h-svh flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[4.75rem]" : "lg:pl-60"
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
