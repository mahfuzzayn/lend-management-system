import { redirect } from "next/navigation";

/**
 * Overview lives at /dashboard/overview (review fix F3); /dashboard is a
 * permanent redirect so old links keep working.
 */
export default function DashboardIndexPage() {
  redirect("/dashboard/overview");
}
