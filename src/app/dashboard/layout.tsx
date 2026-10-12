import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";

/**
 * Dashboard shell (v2). Protection is server-side: src/proxy.ts verifies the
 * session cookie and redirects unauthenticated visits to /login before any
 * dashboard HTML renders - no client-side guard needed.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
