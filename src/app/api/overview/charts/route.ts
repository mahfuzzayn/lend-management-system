import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { ApiError, apiSuccess, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { customersWithDue, flowSeries, recoveryMix } from "@/lib/domain";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { liveFilter } from "@/lib/trash";
import { connectToDatabase } from "@/lib/db";
import type { FlowGranularity, OverviewCharts } from "@/types";

const GRANULARITIES: FlowGranularity[] = ["week", "month", "year"];

/**
 * GET /api/overview/charts - the overview chart series (§5.5b, FR-4.5).
 * Query: granularity = week | month (default) | year (flow buckets).
 * Served separately from /api/overview so the dashboard paints instantly and
 * the charts stream in lazily. Live documents only (§5.5).
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const granularityParam = request.nextUrl.searchParams.get("granularity") ?? "month";
    if (!GRANULARITIES.includes(granularityParam as FlowGranularity)) {
      throw new ApiError(422, "Granularity must be week, month or year.");
    }
    const granularity = granularityParam as FlowGranularity;

    const customers = (await CustomerModel.find(liveFilter())).map(toCustomerDomain);
    const ledger = (await TransactionModel.find(liveFilter())).map(toTransactionDomain);

    const active = customers.filter((c) => c.status === "active");
    const activeIds = new Set(active.map((c) => c.id));
    const activeLedger = ledger.filter((t) => activeIds.has(t.customerId));

    const payload: OverviewCharts = {
      flow: flowSeries(activeLedger, granularity),
      recovery: recoveryMix(customersWithDue(active, activeLedger)),
    };
    return apiSuccess(payload);
  });
}
