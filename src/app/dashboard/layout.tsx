import { DashboardShell } from "@/components/dashboard/shell";

/**
 * Dashboard layout. Protection is server-side: src/proxy.ts verifies the
 * session cookie and redirects unauthenticated visits to /login before any
 * dashboard HTML renders - no client-side guard needed.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
