/**
 * Shared domain types (requirements §5).
 * v1: shaped by mock data. v2: API responses use the same shapes
 * (Decimal128 amounts are serialized to plain numbers).
 */

export type TransactionType = "lend" | "repayment";

export type PaymentMethod = "cash" | "bank" | "mobile-banking" | "other";

export type CustomerStatus = "active" | "archived";

/** Admin roles (requirements §1.4) - carried in the session JWT. */
export type AdminRole = "admin" | "super-admin";

export type BusinessType =
  | "workshop"
  | "contractor"
  | "retail-shop"
  | "company"
  | "individual";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RecoveryStatus =
  | "not-contacted"
  | "contacted"
  | "promise-made"
  | "partial-payment"
  | "completed"
  | "refused"
  | "disputed"
  | "legal-action";

/** Derived from the signed due value - never stored. */
export type DueStatus = "due" | "settled" | "advance";

export interface Customer {
  id: string;
  name: string;
  /** Master-sheet ID (C001…) - assigned on create when omitted. */
  customerCode?: string;
  phone?: string;
  businessName?: string;
  alternativePhone?: string;
  email?: string;
  address?: string;
  area?: string;
  businessType?: BusinessType;
  customerCategory?: string;
  customerSince?: string; // ISO date
  riskLevel?: RiskLevel;
  recoveryStatus?: RecoveryStatus;
  notes?: string;
  status: CustomerStatus;
  /** Set = the customer sits in the Trash (§5.7). */
  deletedAt?: string; // ISO
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
  /** Who recorded it, business-level (master-sheet "Added By"). */
  addedBy?: string;
  /** Master-sheet TRX### reference (not unique - the sheet reuses IDs). */
  referenceCode?: string;
  productCategory?: string;
  verificationStatus?: string;
  referenceSource?: string;
  /** Set = the entry sits in the Trash (§5.7). */
  deletedAt?: string; // ISO
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

/** Transaction as shown in global lists (customer name/code joined). */
export interface TransactionWithCustomer extends Transaction {
  customerName: string;
  customerCode?: string;
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

/** Chart granularity for the in/out flow series (§5.5b). */
export type FlowGranularity = "week" | "month" | "year";

/** One bucket of money out vs in (§5.5b, chart data). */
export interface FlowPoint {
  /** Bucket key - "YYYY-MM-DD" (week start), "YYYY-MM", or "YYYY". */
  key: string;
  /** Human label ("8 Sep", "Aug 26", "2026"). */
  label: string;
  lend: number;
  repayment: number;
}

/** Recovery-status slice of the active-customer mix (§5.5b). */
export interface RecoveryMixSlice {
  /** Recovery status key, "not-set", or "other". */
  key: string;
  label: string;
  count: number;
  /** Net Σ due over the slice (can be negative on advances). */
  outstanding: number;
}

/** Payment-method slice of a ledger (per-customer insight donut). */
export interface MethodMixSlice {
  key: string;
  label: string;
  count: number;
  /** Σ amount through this method. */
  amount: number;
}

/** Payload of GET /api/overview/charts (FR-4.5). */
export interface OverviewCharts {
  flow: FlowPoint[];
  recovery: RecoveryMixSlice[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/** Totals over the FULL filtered scope, not just the current page (FR-7.6). */
export interface TransactionFilterSummary {
  count: number;
  totalLent: number;
  totalReceived: number;
}

export interface TransactionsPage extends Paginated<TransactionWithCustomer> {
  summary: TransactionFilterSummary;
}

/** v2 only - API session info. */
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}
