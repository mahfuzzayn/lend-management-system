import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { apiSuccess, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { overviewStats } from "@/lib/domain";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/overview - dashboard stat block (§6.4). The pure calculator
 * keeps archived customers out of the running totals (§5.5).
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const customers = (await CustomerModel.find({})).map(toCustomerDomain);
    const ledger = (await TransactionModel.find({})).map(toTransactionDomain);

    return apiSuccess(overviewStats(customers, ledger));
  });
}
