import type { CustomerDocument } from "@/models/Customer";
import type { TransactionDocument } from "@/models/Transaction";
import type { Customer, Transaction, TransactionWithCustomer } from "@/types";

/**
 * Mongoose documents → shared domain types (types/index.ts). Every API response
 * passes through here so the v2 payloads match what the v1 Views already
 * consume: string ids, ISO date strings, and Decimal128 amounts as numbers.
 * Money math still happens only inside lib/domain.ts calculators.
 */

export function toCustomerDomain(doc: CustomerDocument): Customer {
  return {
    id: String(doc._id),
    name: doc.name,
    customerCode: doc.customerCode,
    phone: doc.phone,
    businessName: doc.businessName,
    alternativePhone: doc.alternativePhone,
    email: doc.email,
    address: doc.address,
    area: doc.area,
    businessType: doc.businessType,
    customerCategory: doc.customerCategory,
    customerSince: doc.customerSince?.toISOString(),
    riskLevel: doc.riskLevel,
    recoveryStatus: doc.recoveryStatus,
    notes: doc.notes,
    status: doc.status,
    deletedAt: doc.deletedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toTransactionDomain(doc: TransactionDocument): Transaction {
  return {
    id: String(doc._id),
    customerId: String(doc.customerId),
    type: doc.type,
    amount: Number(doc.amount.toString()),
    date: doc.date.toISOString(),
    method: doc.method,
    note: doc.note,
    addedBy: doc.addedBy,
    referenceCode: doc.referenceCode,
    productCategory: doc.productCategory,
    verificationStatus: doc.verificationStatus,
    referenceSource: doc.referenceSource,
    deletedAt: doc.deletedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * Join the customer name + code onto transaction rows WITHOUT re-sorting:
 * callers paginate/order in the database and this preserves that exact order.
 */
export function withCustomerName(
  transactions: Transaction[],
  customerById: Map<string, { name: string; code?: string }>
): TransactionWithCustomer[] {
  return transactions.map((t) => {
    const customer = customerById.get(t.customerId);
    return {
      ...t,
      customerName: customer?.name ?? "Unknown",
      customerCode: customer?.code,
    };
  });
}
