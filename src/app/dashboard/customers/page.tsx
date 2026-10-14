import type { Metadata } from "next";

import { CustomersView } from "@/components/customers/customers-view";
import { sessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Customers",
};

/** Server wrapper: hands the session role to the view (trash/purge gating). */
export default async function CustomersPage() {
  const session = await sessionFromCookies();
  return <CustomersView role={session?.role ?? "admin"} />;
}
