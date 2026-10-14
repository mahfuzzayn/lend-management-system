import { type NextRequest } from "next/server";
import CustomerModel from "@/models/Customer";
import TransactionModel from "@/models/Transaction";
import { customerSchema, RECOVERY_STATUSES, RISK_LEVELS } from "@/schemas";
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
import { liveFilter, trashFilter } from "@/lib/trash";
import { connectToDatabase } from "@/lib/db";

/** Every optional customer field: absent in requests, "" in form payloads. */
const OPTIONAL_DEFAULTS = {
  customerCode: "",
  phone: "",
  businessName: "",
  alternativePhone: "",
  email: "",
  address: "",
  area: "",
  businessType: "",
  customerCategory: "",
  customerSince: "",
  riskLevel: "",
  recoveryStatus: "",
  notes: "",
} as const;

/**
 * Next free C### code. Max numeric suffix + 1, zero-padded to the sheet's
 * 3-digit convention (C095 → C096; beyond C999 the padding simply grows).
 * Scans EVERY customer, trash included - a code stays taken while its owner
 * sits in the Trash (§5.7).
 */
async function nextCustomerCode(): Promise<string> {
  const codes = await CustomerModel.find({}, "customerCode");
  let max = 0;
  for (const { customerCode } of codes) {
    const n = customerCode ? Number(customerCode.replace(/^C/i, "")) : 0;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `C${String(max + 1).padStart(3, "0")}`;
}

/** Validated riskLevel/recoveryStatus query params ("" when absent). */
function enumParam(
  value: string | null,
  allowed: readonly string[],
  message: string
): string {
  if (!value) return "";
  if (!allowed.includes(value)) throw new ApiError(422, message);
  return value;
}

/**
 * GET /api/customers - paginated list with derived dues.
 * Query: search (code/name/business/phone/alt-phone/area, partial,
 * case-insensitive), riskLevel, recoveryStatus, status
 * (active|archived|all - archived hidden by default, §5.2), trash (§5.7),
 * page, limit. Sorted newest-first to match the v1 list.
 */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const status = params.get("status");
    const riskLevel = enumParam(
      params.get("riskLevel"),
      RISK_LEVELS,
      "Unknown risk level."
    );
    const recoveryStatus = enumParam(
      params.get("recoveryStatus"),
      RECOVERY_STATUSES,
      "Unknown recovery status."
    );
    const inTrash = params.get("trash") === "true";
    const page = intParam(params.get("page"), 1, 1);
    const limit = intParam(params.get("limit"), 10, 1, 100);

    // Trash mode shows soft-deleted rows only (§5.7); status is meaningless there.
    const filter: Record<string, unknown> = inTrash ? trashFilter() : {};
    if (!inTrash) {
      if (status === "active" || status === "archived") {
        filter.status = status;
      } else if (status !== "all") {
        filter.status = { $ne: "archived" };
      }
    }
    if (riskLevel) filter.riskLevel = riskLevel;
    if (recoveryStatus) filter.recoveryStatus = recoveryStatus;
    if (search) {
      const rx = new RegExp(escapeRegExp(search), "i");
      filter.$or = [
        { name: rx },
        { phone: rx },
        { alternativePhone: rx },
        { customerCode: rx },
        { businessName: rx },
        { area: rx },
      ];
    }

    const total = await CustomerModel.countDocuments(filter);
    const docs = await CustomerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Dues are derived (§5.1) - one ledger sweep feeds the pure calculators.
    // Live entries only: trashed money is invisible (§5.5).
    const ledger = (
      await TransactionModel.find(liveFilter(), "customerId type amount date createdAt")
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

/** POST /api/customers - create; duplicate phone or code → 409 (unique indexes). */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    requireSession(request);
    await connectToDatabase();

    const raw = (await readJson(request)) as Record<string, unknown> | null;
    // Optional fields default to empty: the shared schema types them as
    // strings (the forms always send them), but the API accepts omission.
    const parsed = customerSchema.safeParse({ ...OPTIONAL_DEFAULTS, ...(raw ?? {}) });
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    const v = parsed.data;
    const doc = await CustomerModel.create({
      name: v.name,
      customerCode: v.customerCode || (await nextCustomerCode()),
      phone: v.phone || undefined,
      businessName: v.businessName || undefined,
      alternativePhone: v.alternativePhone || undefined,
      email: v.email || undefined,
      address: v.address || undefined,
      area: v.area || undefined,
      businessType: v.businessType || undefined,
      customerCategory: v.customerCategory || undefined,
      customerSince: v.customerSince ? new Date(`${v.customerSince}T00:00:00.000Z`) : undefined,
      riskLevel: v.riskLevel || undefined,
      recoveryStatus: v.recoveryStatus || undefined,
      notes: v.notes || undefined,
    });

    // Fresh customer: settled ledger, zero totals (derived, never stored).
    const [row] = customersWithDue([toCustomerDomain(doc)], []);
    return apiSuccess(row, { status: 201 });
  });
}
