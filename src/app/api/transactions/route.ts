import { type NextRequest } from "next/server";
import mongoose from "mongoose";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { transactionSchema } from "@/schemas";
import {
  ApiError,
  apiSuccess,
  intParam,
  readJson,
  withApi,
  zodMessage,
} from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { customerSummary } from "@/lib/domain";
import { toTransactionDomain, withCustomerName } from "@/lib/serialize";
import { liveFilter, trashFilter } from "@/lib/trash";
import { connectToDatabase } from "@/lib/db";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/transactions - newest-first ledger with customer names.
 * Query: customerId, type, from, to (inclusive), trash (§5.7), page, limit.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const page = intParam(params.get("page"), 1, 1);
    const limit = intParam(params.get("limit"), 15, 1, 100);

    // Trash mode shows soft-deleted entries only (§5.7).
    const filter: Record<string, unknown> =
      params.get("trash") === "true" ? trashFilter() : liveFilter();

    const customerId = params.get("customerId");
    if (customerId) {
      if (!mongoose.isValidObjectId(customerId)) {
        throw new ApiError(422, "Unknown customer.");
      }
      filter.customerId = customerId;
    }

    const type = params.get("type");
    if (type) {
      if (type !== "lend" && type !== "repayment") {
        throw new ApiError(422, "Unknown transaction type.");
      }
      filter.type = type;
    }

    const from = params.get("from");
    const to = params.get("to");
    const dateFilter: Record<string, unknown> = {};
    if (from) {
      if (!ISO_DATE_RE.test(from)) throw new ApiError(422, "'from' must be a YYYY-MM-DD date.");
      dateFilter.$gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      if (!ISO_DATE_RE.test(to)) throw new ApiError(422, "'to' must be a YYYY-MM-DD date.");
      dateFilter.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;

    const total = await TransactionModel.countDocuments(filter);
    const docs = await TransactionModel.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Summary covers the whole filter scope (FR-7.6) - computed through the
    // shared calculators, same as every other money total. Full documents on
    // purpose: the serializer reads date/createdAt, so a narrow projection
    // would break it.
    const scope = await TransactionModel.find(filter);
    const scopeSummary = customerSummary(scope.map(toTransactionDomain));

    const customers = await CustomerModel.find({}, "name customerCode deletedAt");
    const customerById = new Map(
      customers.map((c) => [
        String(c._id),
        { name: c.name, code: c.customerCode ?? undefined, deleted: Boolean(c.deletedAt) },
      ])
    );

    const items = withCustomerName(docs.map(toTransactionDomain), customerById);
    return apiSuccess({
      items,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
      summary: {
        count: total,
        totalLent: scopeSummary.totalLent,
        totalReceived: scopeSummary.totalReceived,
      },
    });
  });
}

/** POST /api/transactions - append to the ledger; unknown customer → 422. */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const session = requireSession(request);
    await connectToDatabase();

    const raw = (await readJson(request)) as Record<string, unknown> | null;
    // Optional fields default: the shared schema types the extras as strings
    // (the form always sends them), but the API accepts omission (§5.3).
    const parsed = transactionSchema.safeParse({
      method: "cash",
      note: "",
      addedBy: session.name, // business-level "who recorded it" (§5.3)
      referenceCode: "",
      productCategory: "",
      verificationStatus: "",
      referenceSource: "",
      ...(raw ?? {}),
    });
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const customer = await CustomerModel.findById(parsed.data.customerId);
    if (!customer) throw new ApiError(422, "That customer does not exist.");
    if (customer.deletedAt) {
      throw new ApiError(422, "That customer is in the trash - restore them first.");
    }

    const v = parsed.data;
    const doc = await TransactionModel.create({
      customerId: customer._id,
      type: v.type,
      amount: mongoose.Types.Decimal128.fromString(String(v.amount)),
      // Form dates are plain YYYY-MM-DD → UTC midnight keeps them stable.
      date: new Date(`${v.date}T00:00:00.000Z`),
      method: v.method,
      note: v.note || undefined,
      addedBy: v.addedBy || undefined,
      referenceCode: v.referenceCode || undefined,
      productCategory: v.productCategory || undefined,
      verificationStatus: v.verificationStatus || undefined,
      referenceSource: v.referenceSource || undefined,
      createdBy: new mongoose.Types.ObjectId(session.sub),
    });

    return apiSuccess(
      { ...toTransactionDomain(doc), customerName: customer.name },
      { status: 201 }
    );
  });
}
