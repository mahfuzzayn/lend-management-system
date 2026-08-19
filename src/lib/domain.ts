import type {
  Customer,
  CustomerSummary,
  CustomerWithDue,
  DueStatus,
  OverviewStats,
  Transaction,
  TransactionWithBalance,
  TransactionWithCustomer,
} from "../types";

/**
 * Pure domain calculators (requirements §5.5) - every due, balance, and total
 * in the app is derived here. v1 runs them over the mock dataset; v2 runs the
 * same functions over API data (and mirrors them in Mongo aggregations).
 */

export function dueStatusOf(due: number): DueStatus {
  if (due > 0) return "due";
  if (due < 0) return "advance";
  return "settled";
}

/** Oldest first: date asc, then createdAt asc, then id for stability. */
function chronological(a: Transaction, b: Transaction): number {
  const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
  if (diff !== 0) return diff;
  const created =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (created !== 0) return created;
  return a.id.localeCompare(b.id);
}

/** Newest first. */
function reverseChronological(a: Transaction, b: Transaction): number {
  return chronological(b, a);
}

export function customerSummary(transactions: Transaction[]): CustomerSummary {
  let totalLent = 0;
  let totalReceived = 0;
  for (const t of transactions) {
    if (t.type === "lend") totalLent += t.amount;
    else totalReceived += t.amount;
  }
  const due = totalLent - totalReceived;
  return { totalLent, totalReceived, due, dueStatus: dueStatusOf(due) };
}

/** Ledger rows with a running balance, oldest → newest. */
export function withRunningBalance(
  transactions: Transaction[]
): TransactionWithBalance[] {
  const sorted = [...transactions].sort(chronological);
  let balance = 0;
  return sorted.map((t) => {
    balance += t.type === "lend" ? t.amount : -t.amount;
    return { ...t, balance };
  });
}

export function lastTransactionDate(
  customerId: string,
  transactions: Transaction[]
): string | null {
  let latest: string | null = null;
  for (const t of transactions) {
    if (t.customerId !== customerId) continue;
    if (latest === null || new Date(t.date) > new Date(latest)) {
      latest = t.date;
    }
  }
  return latest;
}

/** Customers enriched with derived ledger totals (lists, dues table). */
export function customersWithDue(
  customers: Customer[],
  transactions: Transaction[]
): CustomerWithDue[] {
  return customers.map((customer) => {
    const summary = customerSummary(
      transactions.filter((t) => t.customerId === customer.id)
    );
    return {
      ...customer,
      ...summary,
      lastTransactionDate: lastTransactionDate(customer.id, transactions),
    };
  });
}

/** Global ledger view - newest first, customer name joined. */
export function transactionsWithCustomer(
  transactions: Transaction[],
  customers: Customer[]
): TransactionWithCustomer[] {
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  return transactions
    .map((t) => ({ ...t, customerName: nameById.get(t.customerId) ?? "Unknown" }))
    .sort(reverseChronological);
}

/**
 * Overview stats. Totals cover active customers only (archived history is
 * retained but out of the running numbers). Outstanding is the net signed
 * sum - an advance reduces it, keeping it equal to lent − collected.
 */
export function overviewStats(
  customers: Customer[],
  transactions: Transaction[]
): OverviewStats {
  const active = customers.filter((c) => c.status === "active");
  const activeIds = new Set(active.map((c) => c.id));
  const activeTransactions = transactions.filter((t) => activeIds.has(t.customerId));

  const summary = customerSummary(activeTransactions);
  const withDue = customersWithDue(active, activeTransactions);

  const topDues = withDue
    .filter((c) => c.due > 0)
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    totalCustomers: active.length,
    totalLent: summary.totalLent,
    totalCollected: summary.totalReceived,
    totalOutstanding: summary.due,
    recentTransactions: transactionsWithCustomer(activeTransactions, active).slice(0, 10),
    topDues,
  };
}
