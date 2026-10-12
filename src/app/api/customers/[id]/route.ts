import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { customerSchema } from "@/schemas";
import { ApiError, apiSuccess, readJson, withApi, zodMessage } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { customerSummary, withRunningBalance } from "@/lib/domain";
import { connectToDatabase } from "@/lib/db";
import type { CustomerDetail } from "@/types";

async function findCustomerOr404(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Customer not found.");
  const doc = await CustomerModel.findById(id);
  if (!doc) throw new ApiError(404, "Customer not found.");
  return doc;
}

/**
 * GET /api/customers/[id] - profile + summary + full history with running
 * balance (§6.2). This is also the PDF payload (§10).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await findCustomerOr404(id);

    const ledger = (
      await TransactionModel.find({ customerId: doc._id }).sort({ date: 1, createdAt: 1 })
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
    await findCustomerOr404(id);

    const parsed = customerSchema.partial().safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const updates: Record<string, unknown> = {};
    const v = parsed.data;
    if (v.name !== undefined) updates.name = v.name;
    if (v.phone !== undefined) updates.phone = v.phone;
    if (v.email !== undefined) updates.email = v.email || undefined;
    if (v.address !== undefined) updates.address = v.address || undefined;
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

/** DELETE /api/customers/[id] - removes the customer AND their transactions (§6.2). */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const { id } = await ctx.params;
    const doc = await CustomerModel.findByIdAndDelete(id);
    if (!doc) throw new ApiError(404, "Customer not found.");

    const removed = await TransactionModel.deleteMany({ customerId: doc._id });
    return apiSuccess({ id: String(doc._id), transactionsDeleted: removed.deletedCount });
  });
}
