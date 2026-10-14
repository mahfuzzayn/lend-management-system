import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { apiSuccess, ApiError, escapeRegExp, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { customersWithDue } from "@/lib/domain";
import { liveFilter } from "@/lib/trash";
import { RECOVERY_STATUSES, RISK_LEVELS } from "@/schemas";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/dues - per-customer due rows, highest outstanding first.
 * Query: search (code/name/business/phone/alt-phone/area), riskLevel,
 * recoveryStatus, onlyWithDue (default true - settled/advance hidden).
 * Live customers only, matching the v1 dues table; trashed money is
 * invisible to derived math (§5.5).
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim().toLowerCase() ?? "";
    const onlyWithDue = params.get("onlyWithDue") !== "false";
    const riskLevel = params.get("riskLevel");
    const recoveryStatus = params.get("recoveryStatus");
    if (riskLevel && !RISK_LEVELS.includes(riskLevel as (typeof RISK_LEVELS)[number])) {
      throw new ApiError(422, "Unknown risk level.");
    }
    if (
      recoveryStatus &&
      !RECOVERY_STATUSES.includes(recoveryStatus as (typeof RECOVERY_STATUSES)[number])
    ) {
      throw new ApiError(422, "Unknown recovery status.");
    }

    const customers = (
      await CustomerModel.find(liveFilter({ status: "active" }))
    ).map(toCustomerDomain);
    const ledger = (
      await TransactionModel.find(liveFilter(), "customerId type amount date createdAt")
    ).map(toTransactionDomain);

    let rows = customersWithDue(customers, ledger).sort(
      (a, b) => b.due - a.due || a.name.localeCompare(b.name)
    );

    if (onlyWithDue) rows = rows.filter((c) => c.due > 0);
    if (riskLevel) rows = rows.filter((c) => c.riskLevel === riskLevel);
    if (recoveryStatus) rows = rows.filter((c) => c.recoveryStatus === recoveryStatus);
    if (search) {
      const rx = new RegExp(escapeRegExp(search), "i");
      rows = rows.filter(
        (c) =>
          rx.test(c.name) ||
          rx.test(c.phone ?? "") ||
          rx.test(c.alternativePhone ?? "") ||
          rx.test(c.customerCode ?? "") ||
          rx.test(c.businessName ?? "") ||
          rx.test(c.area ?? "")
      );
    }

    return apiSuccess(rows);
  });
}
