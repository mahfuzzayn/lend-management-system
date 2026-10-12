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
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    notes: doc.notes,
    status: doc.status,
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
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * Join the customer name onto transaction rows WITHOUT re-sorting: callers
 * paginate/order in the database and this preserves that exact order.
 */
export function withCustomerName(
  transactions: Transaction[],
  nameById: Map<string, string>
): TransactionWithCustomer[] {
  return transactions.map((t) => ({
    ...t,
    customerName: nameById.get(t.customerId) ?? "Unknown",
  }));
}
