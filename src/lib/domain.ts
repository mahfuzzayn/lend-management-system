import type {
  Customer,
  CustomerSummary,
  CustomerWithDue,
  DueStatus,
  FlowGranularity,
  FlowPoint,
  MethodMixSlice,
  OverviewStats,
  RecoveryMixSlice,
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

/** Global ledger view - newest first, customer name/code joined. */
export function transactionsWithCustomer(
  transactions: Transaction[],
  customers: Customer[]
): TransactionWithCustomer[] {
  const infoById = new Map(
    customers.map((c) => [c.id, { name: c.name, code: c.customerCode }])
  );
  return transactions
    .map((t) => {
      const info = infoById.get(t.customerId);
      return { ...t, customerName: info?.name ?? "Unknown", customerCode: info?.code };
    })
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

/* ------------------------------------------------------------------ */
/* Overview chart series (§5.5b) - pure, like every other total here.  */
/* ------------------------------------------------------------------ */

/** "2026-08-14T…" → "2026-08-14" (dates are UTC-midnight of the calendar day). */
function dayKeyOf(iso: string): string {
  return iso.slice(0, 10);
}

/** "2026-08-14" → UTC Date (dates are UTC-midnight of the recorded day). */
function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Monday-start week key "YYYY-MM-DD" of an ISO day (UTC weeks). */
function weekKeyOf(dayKey: string): string {
  const date = dayKeyToDate(dayKey);
  const weekday = (date.getUTCDay() + 6) % 7; // Mon = 0
  date.setUTCDate(date.getUTCDate() - weekday);
  return date.toISOString().slice(0, 10);
}

function nextWeekKey(key: string): string {
  const date = dayKeyToDate(key);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}

function nextMonthKey(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
}

const WEEK_LABEL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });

function flowLabel(key: string, granularity: FlowGranularity): string {
  if (granularity === "year") return key;
  if (granularity === "month") return MONTH_LABEL.format(dayKeyToDate(`${key}-01`));
  return WEEK_LABEL.format(dayKeyToDate(key));
}

/**
 * Money out vs in bucketed by granularity (§5.5b): weeks (last 12), months
 * (last 12), or years (all). Empty buckets stay in so the rhythm shows; the
 * window never starts before the ledger's first entry.
 */
export function flowSeries(
  transactions: Transaction[],
  granularity: FlowGranularity = "month",
  now: Date = new Date()
): FlowPoint[] {
  if (transactions.length === 0) return [];

  const bucketOf = (iso: string): string => {
    const day = dayKeyOf(iso);
    if (granularity === "week") return weekKeyOf(day);
    if (granularity === "year") return day.slice(0, 4);
    return day.slice(0, 7);
  };
  const nextKey = granularity === "week" ? nextWeekKey : granularity === "year" ? (k: string) => `${Number(k) + 1}` : nextMonthKey;

  const sums = new Map<string, { lend: number; repayment: number }>();
  let earliest: string | null = null;
  for (const t of transactions) {
    const key = bucketOf(t.date);
    const bucket = sums.get(key) ?? { lend: 0, repayment: 0 };
    if (t.type === "lend") bucket.lend += t.amount;
    else bucket.repayment += t.amount;
    sums.set(key, bucket);
    if (earliest === null || key < earliest) earliest = key;
  }

  // Window: last 12 buckets (all of them for years), never before entry #1.
  const today = now.toISOString().slice(0, 10);
  let windowStart: string;
  let currentKey: string;
  if (granularity === "week") {
    // Last 12 Monday-start weeks, ending on the current week.
    const start = dayKeyToDate(weekKeyOf(today));
    start.setUTCDate(start.getUTCDate() - 11 * 7);
    windowStart = start.toISOString().slice(0, 10);
    currentKey = weekKeyOf(today);
  } else if (granularity === "year") {
    windowStart = String(now.getUTCFullYear() - 50);
    currentKey = String(now.getUTCFullYear());
  } else {
    windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
      .toISOString()
      .slice(0, 7);
    currentKey = today.slice(0, 7);
  }
  let start = earliest !== null && earliest > windowStart ? earliest : windowStart;

  const points: FlowPoint[] = [];
  while (start <= currentKey) {
    const bucket = sums.get(start) ?? { lend: 0, repayment: 0 };
    points.push({ key: start, label: flowLabel(start, granularity), ...bucket });
    start = nextKey(start);
    if (points.length > 60) break; // pathological-data guard
  }
  return points;
}

/** Display labels for the recovery mix (single source for the donut). */
const RECOVERY_LABELS: Record<string, string> = {
  "not-contacted": "Not contacted",
  contacted: "Contacted",
  "promise-made": "Promise made",
  "partial-payment": "Partial payment",
  completed: "Completed",
  refused: "Refused",
  disputed: "Disputed",
  "legal-action": "Legal action",
  "not-set": "Not set",
  other: "Other",
};

/**
 * Active customers grouped by recovery status, biggest groups first.
 * The rare tail (refused, legal-action) folds into "Other" so the donut
 * stays within its ≤6 meaningful segments; "Not set" stays visible and
 * "Other" always sorts last.
 */
export function recoveryMix(rows: CustomerWithDue[]): RecoveryMixSlice[] {
  const buckets = new Map<string, RecoveryMixSlice>();
  for (const row of rows) {
    const status = row.recoveryStatus;
    const key =
      status === undefined
        ? "not-set"
        : status === "refused" || status === "legal-action"
          ? "other"
          : status;
    const bucket = buckets.get(key) ?? {
      key,
      label: RECOVERY_LABELS[key] ?? key,
      count: 0,
      outstanding: 0,
    };
    bucket.count += 1;
    bucket.outstanding += row.due;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => {
    if (a.key === "other") return 1;
    if (b.key === "other") return -1;
    return b.count - a.count || a.label.localeCompare(b.label);
  });
}

/**
 * Payment-method mix over a ledger (per-customer insight donut): entries
 * and Σ amount per method, busiest first.
 */
export function methodMix(transactions: Transaction[]): MethodMixSlice[] {
  const buckets = new Map<string, MethodMixSlice>();
  for (const t of transactions) {
    const bucket = buckets.get(t.method) ?? { key: t.method, label: t.method, count: 0, amount: 0 };
    bucket.count += 1;
    bucket.amount += t.amount;
    buckets.set(t.method, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
