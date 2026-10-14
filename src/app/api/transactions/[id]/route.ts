import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { transactionSchema } from "@/schemas";
import { ApiError, apiSuccess, readJson, withApi, zodMessage } from "@/lib/api";
import { requireSession, requireSuperAdmin } from "@/lib/auth";
import { toTransactionDomain } from "@/lib/serialize";
import { connectToDatabase } from "@/lib/db";

async function findTransactionOr404(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Transaction not found.");
  const doc = await TransactionModel.findById(id);
  if (!doc) throw new ApiError(404, "Transaction not found.");
  return doc;
}

async function customerOf(
  customerId: mongoose.Types.ObjectId
): Promise<{ customerName: string; customerCode?: string }> {
  const customer = await CustomerModel.findById(customerId, "name customerCode");
  return { customerName: customer?.name ?? "Unknown", customerCode: customer?.customerCode ?? undefined };
}

/** PATCH /api/transactions/[id] - partial update (re-validated on save). */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await findTransactionOr404(id);
    if (doc.deletedAt) {
      throw new ApiError(422, "This entry is in the trash - restore it first.");
    }

    const parsed = transactionSchema.partial().safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const v = parsed.data;
    if (v.customerId !== undefined) {
      const customer = await CustomerModel.findById(v.customerId);
      if (!customer) throw new ApiError(422, "That customer does not exist.");
      if (customer.deletedAt) {
        throw new ApiError(422, "That customer is in the trash - restore them first.");
      }
      doc.customerId = customer._id;
    }
    if (v.type !== undefined) doc.type = v.type;
    if (v.amount !== undefined) {
      doc.amount = mongoose.Types.Decimal128.fromString(String(v.amount));
    }
    if (v.date !== undefined) doc.date = new Date(`${v.date}T00:00:00.000Z`);
    if (v.method !== undefined) doc.method = v.method;
    if (v.note !== undefined) doc.note = v.note || undefined;
    if (v.addedBy !== undefined) doc.addedBy = v.addedBy || undefined;
    if (v.referenceCode !== undefined) doc.referenceCode = v.referenceCode || undefined;
    if (v.productCategory !== undefined) doc.productCategory = v.productCategory || undefined;
    if (v.verificationStatus !== undefined) {
      doc.verificationStatus = v.verificationStatus || undefined;
    }
    if (v.referenceSource !== undefined) doc.referenceSource = v.referenceSource || undefined;

    await doc.save();

    return apiSuccess({
      ...toTransactionDomain(doc),
      ...(await customerOf(doc.customerId)),
    });
  });
}

/**
 * DELETE /api/transactions/[id] - soft delete (§5.7): the entry moves to the
 * Trash. `?purge=true` (super admin only) removes it permanently.
 */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  return withApi(async () => {
    const session = requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;

    if (request.nextUrl.searchParams.get("purge") === "true") {
      // Role gate first (§11.7): purge is super-admin territory, full stop.
      requireSuperAdmin(request);
      const purged = await TransactionModel.findByIdAndDelete(id);
      if (!purged) throw new ApiError(404, "Transaction not found.");
      return apiSuccess({ id: String(purged._id), purged: true });
    }

    const doc = await findTransactionOr404(id);
    if (doc.deletedAt) {
      throw new ApiError(422, "This entry is already in the trash.");
    }

    doc.deletedAt = new Date();
    doc.deletedBy = new mongoose.Types.ObjectId(session.sub);
    await doc.save();

    return apiSuccess({ id: String(doc._id), trashedAt: doc.deletedAt.toISOString() });
  });
}
