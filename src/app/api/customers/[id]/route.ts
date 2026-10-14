import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { customerSchema } from "@/schemas";
import { ApiError, apiSuccess, readJson, withApi, zodMessage } from "@/lib/api";
import { requireSession, requireSuperAdmin } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { customerSummary, withRunningBalance } from "@/lib/domain";
import { liveFilter } from "@/lib/trash";
import { connectToDatabase } from "@/lib/db";
import type { CustomerDetail } from "@/types";

async function findCustomerOr404(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Customer not found.");
  const doc = await CustomerModel.findById(id);
  if (!doc) throw new ApiError(404, "Customer not found.");
  return doc;
}

/**
 * GET /api/customers/[id] - profile + summary + full live history with
 * running balance (§6.2). This is also the PDF payload (§10). Trashed
 * customers still resolve (the detail page shows a trash banner).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await findCustomerOr404(id);

    const ledger = (
      await TransactionModel.find(liveFilter({ customerId: doc._id })).sort({
        date: 1,
        createdAt: 1,
      })
    ).map(toTransactionDomain);

    const payload: CustomerDetail = {
      customer: toCustomerDomain(doc),
      summary: customerSummary(ledger),
      transactions: withRunningBalance(ledger),
    };
    return apiSuccess(payload);
  });
}

/** PATCH /api/customers/[id] - partial update; phone collision → 409. */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const existing = await findCustomerOr404(id);
    if (existing.deletedAt) {
      throw new ApiError(422, "This customer is in the trash - restore them first.");
    }

    const parsed = customerSchema.partial().safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const updates: Record<string, unknown> = {};
    const v = parsed.data;
    if (v.name !== undefined) updates.name = v.name;
    if (v.customerCode !== undefined) updates.customerCode = v.customerCode || undefined;
    if (v.phone !== undefined) updates.phone = v.phone || undefined;
    if (v.businessName !== undefined) updates.businessName = v.businessName || undefined;
    if (v.alternativePhone !== undefined) updates.alternativePhone = v.alternativePhone || undefined;
    if (v.email !== undefined) updates.email = v.email || undefined;
    if (v.address !== undefined) updates.address = v.address || undefined;
    if (v.area !== undefined) updates.area = v.area || undefined;
    if (v.businessType !== undefined) updates.businessType = v.businessType || undefined;
    if (v.customerCategory !== undefined) updates.customerCategory = v.customerCategory || undefined;
    if (v.customerSince !== undefined) {
      updates.customerSince = v.customerSince
        ? new Date(`${v.customerSince}T00:00:00.000Z`)
        : undefined;
    }
    if (v.riskLevel !== undefined) updates.riskLevel = v.riskLevel || undefined;
    if (v.recoveryStatus !== undefined) updates.recoveryStatus = v.recoveryStatus || undefined;
    if (v.notes !== undefined) updates.notes = v.notes || undefined;
    if (Object.keys(updates).length === 0) {
      throw new ApiError(422, "Nothing to update.");
    }

    const doc = await CustomerModel.findByIdAndUpdate(id, { $set: updates }, {
      runValidators: true,
      returnDocument: "after",
    });
    if (!doc) throw new ApiError(404, "Customer not found.");

    return apiSuccess(toCustomerDomain(doc));
  });
}

/**
 * DELETE /api/customers/[id] - soft delete (§5.7): the customer and their
 * live transactions move to the Trash (one shared timestamp so restore can
 * bring the ledger back as a unit). `?purge=true` (super admin only)
 * removes everything permanently, cascading a hard delete.
 */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  return withApi(async () => {
    const session = requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;

    if (request.nextUrl.searchParams.get("purge") === "true") {
      // Role gate first (§11.7): purge is super-admin territory, full stop.
      requireSuperAdmin(request);
      const doc = await findCustomerOr404(id);
      await CustomerModel.findByIdAndDelete(id);
      const removed = await TransactionModel.deleteMany({ customerId: doc._id });
      return apiSuccess({ id: String(doc._id), transactionsDeleted: removed.deletedCount, purged: true });
    }

    const doc = await findCustomerOr404(id);

    if (doc.deletedAt) {
      throw new ApiError(422, "This customer is already in the trash.");
    }

    const deletedAt = new Date();
    const deletedBy = new mongoose.Types.ObjectId(session.sub);
    doc.deletedAt = deletedAt;
    doc.deletedBy = deletedBy;
    await doc.save();

    // Cascade: their LIVE entries follow the customer into the trash with the
    // same timestamp - restore matches on it to bring exactly these back.
    const trashed = await TransactionModel.updateMany(
      { customerId: doc._id, deletedAt: null },
      { deletedAt, deletedBy }
    );

    return apiSuccess({
      id: String(doc._id),
      transactionsTrashed: trashed.modifiedCount,
      trashedAt: deletedAt.toISOString(),
    });
  });
}
