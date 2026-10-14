import type { Metadata } from "next";

import { CustomerDetailView } from "@/components/customers/customer-detail-view";
import { sessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Customer",
};

/** Server wrapper: hands the session role to the view (trash banner actions). */
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, sessionFromCookies()]);
  return <CustomerDetailView customerId={id} role={session?.role ?? "admin"} />;
}
