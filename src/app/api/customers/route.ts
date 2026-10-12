import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { customerSchema } from "@/schemas";
import {
  ApiError,
  apiSuccess,
  escapeRegExp,
  intParam,
  readJson,
  withApi,
  zodMessage,
} from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { toCustomerDomain, toTransactionDomain } from "@/lib/serialize";
import { customersWithDue } from "@/lib/domain";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/customers - paginated list with derived dues.
 * Query: search (name/phone, partial, case-insensitive), status
 * (active|archived|all - archived is hidden by default, §5.2), page, limit.
 * Sorted newest-first to match the v1 list.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const status = params.get("status");
    const page = intParam(params.get("page"), 1, 1);
    const limit = intParam(params.get("limit"), 10, 1, 100);

    const filter: Record<string, unknown> = {};
    if (status === "active" || status === "archived") {
      filter.status = status;
    } else if (status !== "all") {
      filter.status = { $ne: "archived" };
    }
    if (search) {
      const rx = new RegExp(escapeRegExp(search), "i");
      filter.$or = [{ name: rx }, { phone: rx }];
    }

    const total = await CustomerModel.countDocuments(filter);
    const docs = await CustomerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Dues are derived (§5.1) - one ledger sweep feeds the pure calculators.
    const ledger = (
      await TransactionModel.find({}, "customerId type amount date createdAt")
    ).map(toTransactionDomain);

    const items = customersWithDue(docs.map(toCustomerDomain), ledger);

    return apiSuccess({
      items,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  });
}

/** POST /api/customers - create; duplicate phone → 409 (via the unique index). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const raw = (await readJson(request)) as Record<string, unknown> | null;
    // Optional fields default to empty: the shared schema types them as
    // strings (the forms always send them), but the API accepts omission.
    const parsed = customerSchema.safeParse({ email: "", address: "", notes: "", ...(raw ?? {}) });
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const { name, phone, email, address, notes } = parsed.data;
    const doc = await CustomerModel.create({
      name,
      phone,
      email: email || undefined,
      address: address || undefined,
      notes: notes || undefined,
    });

    // Fresh customer: settled ledger, zero totals (derived, never stored).
    const [row] = customersWithDue([toCustomerDomain(doc)], []);
    return apiSuccess(row, { status: 201 });
  });
}
