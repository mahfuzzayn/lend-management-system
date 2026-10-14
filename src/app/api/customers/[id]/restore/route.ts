import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { ApiError, apiSuccess, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain } from "@/lib/serialize";
import { connectToDatabase } from "@/lib/db";

/**
 * POST /api/customers/[id]/restore - bring a trashed customer (§5.7) and the
 * transactions that were cascade-deleted with it (matched by the shared
 * deletedAt) back to the live ledger. Open to any admin - undoing a mistake
 * should never need a super admin.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/customers/[id]/restore">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await CustomerModel.findById(id);
    if (!doc) throw new ApiError(404, "Customer not found.");
    if (!doc.deletedAt) throw new ApiError(422, "This customer is not in the trash.");

    const cascadeDeletedAt = doc.deletedAt;
    doc.deletedAt = undefined;
    doc.deletedBy = undefined;
    await doc.save();

    const restored = await TransactionModel.updateMany(
      { customerId: doc._id, deletedAt: cascadeDeletedAt },
      { $unset: { deletedAt: "", deletedBy: "" } }
    );

    return apiSuccess({
      customer: toCustomerDomain(doc),
      transactionsRestored: restored.modifiedCount,
    });
  });
}
