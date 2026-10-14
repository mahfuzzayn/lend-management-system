import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { ApiError, apiSuccess, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toTransactionDomain } from "@/lib/serialize";
import { connectToDatabase } from "@/lib/db";

/**
 * POST /api/transactions/[id]/restore - bring a trashed ledger entry (§5.7)
 * back to the live ledger. Open to any admin - undoing a mistake should
 * never need a super admin. Entries that left the live ledger WITH a trashed
 * customer stay in the trash until the customer is restored: a live entry
 * under a trashed owner would reappear in dues and totals (works.md #1).
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/transactions/[id]/restore">
) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await TransactionModel.findById(id);
    if (!doc) throw new ApiError(404, "Transaction not found.");
    if (!doc.deletedAt) throw new ApiError(422, "This entry is not in the trash.");

    const customer = await CustomerModel.findById(doc.customerId);
    if (!customer) throw new ApiError(422, "Their customer no longer exists - purge this entry instead.");
    if (customer.deletedAt) {
      throw new ApiError(422, "Their customer is still in the trash - restore the customer first.");
    }

    doc.deletedAt = undefined;
    doc.deletedBy = undefined;
    await doc.save();

    return apiSuccess(toTransactionDomain(doc));
  });
}
