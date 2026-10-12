import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { transactionSchema } from "@/schemas";
import { ApiError, apiSuccess, readJson, withApi, zodMessage } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toTransactionDomain } from "@/lib/serialize";
import { connectToDatabase } from "@/lib/db";

async function findTransactionOr404(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Transaction not found.");
  const doc = await TransactionModel.findById(id);
  if (!doc) throw new ApiError(404, "Transaction not found.");
  return doc;
}

async function customerNameOf(customerId: mongoose.Types.ObjectId): Promise<string> {
  const customer = await CustomerModel.findById(customerId, "name");
  return customer?.name ?? "Unknown";
}

/** PATCH /api/transactions/[id] - partial update (re-validated on save). */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await findTransactionOr404(id);

    const parsed = transactionSchema.partial().safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const v = parsed.data;
    if (v.customerId !== undefined) {
      const customer = await CustomerModel.findById(v.customerId);
      if (!customer) throw new ApiError(422, "That customer does not exist.");
      doc.customerId = customer._id;
    }
    if (v.type !== undefined) doc.type = v.type;
    if (v.amount !== undefined) {
      doc.amount = mongoose.Types.Decimal128.fromString(String(v.amount));
    }
    if (v.date !== undefined) doc.date = new Date(`${v.date}T00:00:00.000Z`);
    if (v.method !== undefined) doc.method = v.method;
    if (v.note !== undefined) doc.note = v.note || undefined;

    await doc.save();

    return apiSuccess({
      ...toTransactionDomain(doc),
      customerName: await customerNameOf(doc.customerId),
    });
  });
}

/** DELETE /api/transactions/[id] - remove one ledger entry (confirmed client-side). */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await TransactionModel.findByIdAndDelete(id);
    if (!doc) throw new ApiError(404, "Transaction not found.");

    return apiSuccess({ id: String(doc._id) });
  });
}
