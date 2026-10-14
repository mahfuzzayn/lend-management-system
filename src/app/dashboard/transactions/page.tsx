import type { Metadata } from "next";

import { TransactionsView } from "@/components/transactions/transactions-view";
import { sessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Transactions",
};

/** Server wrapper: hands the session role to the view (trash/purge gating). */
export default async function TransactionsPage() {
  const session = await sessionFromCookies();
  return <TransactionsView role={session?.role ?? "admin"} />;
}
