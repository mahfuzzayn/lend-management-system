import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { apiSuccess, escapeRegExp, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { customersWithDue } from "@/lib/domain";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/dues - per-customer due rows, highest outstanding first.
 * Query: search, onlyWithDue (default true - settled/advance hidden).
 * Active customers only, matching the v1 dues table.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim().toLowerCase() ?? "";
    const onlyWithDue = params.get("onlyWithDue") !== "false";

    const customers = (await CustomerModel.find({ status: "active" })).map(toCustomerDomain);
    const ledger = (
      await TransactionModel.find({}, "customerId type amount date createdAt")
    ).map(toTransactionDomain);

    let rows = customersWithDue(customers, ledger).sort(
      (a, b) => b.due - a.due || a.name.localeCompare(b.name)
    );

    if (onlyWithDue) rows = rows.filter((c) => c.due > 0);
    if (search) {
      const rx = new RegExp(escapeRegExp(search), "i");
      rows = rows.filter((c) => rx.test(c.name) || rx.test(c.phone));
    }

    return apiSuccess(rows);
  });
}
