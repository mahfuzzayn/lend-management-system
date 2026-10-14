import type { Metadata } from "next";

import { OverviewView } from "@/components/dashboard/overview-view";
import { sessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Overview",
};

/** Server wrapper: the greeting addresses the signed-in admin by name (F19). */
export default async function OverviewPage() {
  const session = await sessionFromCookies();
  return <OverviewView adminName={session?.name ?? "Admin"} />;
}
