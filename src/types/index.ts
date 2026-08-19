/**
 * Shared domain types (requirements §5).
 * v1: shaped by mock data. v2: API responses use the same shapes
 * (Decimal128 amounts are serialized to plain numbers).
 */

export type TransactionType = "lend" | "repayment";

export type PaymentMethod = "cash" | "bank" | "mobile-banking" | "other";

export type CustomerStatus = "active" | "archived";

/** Derived from the signed due value - never stored. */
export type DueStatus = "due" | "settled" | "advance";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status: CustomerStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number; // always > 0; sign comes from `type`
  date: string; // ISO - the transaction date (may be back-dated)
  method: PaymentMethod;
  note?: string;
  createdAt: string; // ISO
}

/** Customer row enriched with derived ledger totals (lists, dues table). */
export interface CustomerWithDue extends Customer {
  totalLent: number;
  totalReceived: number;
  /** Signed outstanding: > 0 due · 0 settled · < 0 advance */
  due: number;
  dueStatus: DueStatus;
  lastTransactionDate: string | null;
}

/** Ledger row with running balance (customer detail + PDF). */
export interface TransactionWithBalance extends Transaction {
  /** Cumulative due after this row, chronological. */
  balance: number;
}

/** Transaction as shown in global lists (customer name joined). */
export interface TransactionWithCustomer extends Transaction {
  customerName: string;
}

export interface CustomerSummary {
  totalLent: number;
  totalReceived: number;
  due: number;
  dueStatus: DueStatus;
}

/** Payload of GET /api/customers/[id] (and the mock equivalent). */
export interface CustomerDetail {
  customer: Customer;
  summary: CustomerSummary;
  transactions: TransactionWithBalance[];
}

export interface OverviewStats {
  totalCustomers: number;
  totalLent: number;
  totalCollected: number;
  totalOutstanding: number;
  recentTransactions: TransactionWithCustomer[];
  topDues: CustomerWithDue[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/** v2 only - API session info. */
export interface Admin {
  id: string;
  name: string;
  email: string;
}
