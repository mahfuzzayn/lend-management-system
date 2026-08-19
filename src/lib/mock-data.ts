import type { Customer, Transaction } from "../types";

/**
 * v1 mock dataset (requirements §3.1) - typed, deterministic, hand-checkable.
 * Deliberately includes every ledger shape the UI must handle:
 * due (c-01…), settled (c-03), advance/overpaid (c-04), archived (c-08),
 * back-dated entries (2025-11 →), and entries dated "today" (2026-08-19).
 *
 * Deleted in v2 when the API takes over.
 */

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "c-01",
    name: "Rahim Store",
    phone: "+880 1712-458900",
    email: "rahimstore@gmail.com",
    address: "New Market, Dhaka",
    notes: "Grocer - steady weekly lending cycle.",
    status: "active",
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-08-12T09:30:00.000Z",
  },
  {
    id: "c-02",
    name: "Karim Electronics",
    phone: "+880 1811-223344",
    email: "karim.electronics@yahoo.com",
    address: "Dhanmondi 27, Dhaka",
    notes: "TV & accessories shop - seasonal spikes before Eid.",
    status: "active",
    createdAt: "2026-01-20T14:00:00.000Z",
    updatedAt: "2026-08-19T11:15:00.000Z",
  },
  {
    id: "c-03",
    name: "Nusrat Jahan",
    phone: "+880 1913-556677",
    address: "Mirpur 10, Dhaka",
    notes: "Home tailor - small amounts, always clears.",
    status: "active",
    createdAt: "2026-04-02T09:00:00.000Z",
    updatedAt: "2026-07-05T16:45:00.000Z",
  },
  {
    id: "c-04",
    name: "Jamal Auto Parts",
    phone: "+880 1614-778899",
    address: "Gulistan, Dhaka",
    notes: "Prefers bank transfers. Occasionally rounds repayments up.",
    status: "active",
    createdAt: "2026-02-11T12:30:00.000Z",
    updatedAt: "2026-06-18T10:20:00.000Z",
  },
  {
    id: "c-05",
    name: "Shirin Cosmetics",
    phone: "+880 1515-990011",
    address: "Mohammadpur, Dhaka",
    notes: "Small cosmetics shop - frequent small repayments.",
    status: "active",
    createdAt: "2026-05-06T08:45:00.000Z",
    updatedAt: "2026-08-14T13:05:00.000Z",
  },
  {
    id: "c-06",
    name: "Mannan Furniture Works",
    phone: "+880 1716-334455",
    email: "mannan.furniture@outlook.com",
    address: "Old Dhaka",
    notes: "Large workshop orders - seasonal materials lending.",
    status: "active",
    createdAt: "2025-11-28T11:00:00.000Z",
    updatedAt: "2026-05-28T17:30:00.000Z",
  },
  {
    id: "c-07",
    name: "Farhana Stationery",
    phone: "+880 1817-667788",
    address: "Uttara Sector 4, Dhaka",
    notes: "Exam-season stock borrower.",
    status: "active",
    createdAt: "2026-06-30T09:15:00.000Z",
    updatedAt: "2026-08-17T12:00:00.000Z",
  },
  {
    id: "c-08",
    name: "Sattar & Sons",
    phone: "+880 1918-112233",
    address: "Chawkbazar, Dhaka",
    notes: "Cleared in full and archived - relocated to Chattogram.",
    status: "archived",
    createdAt: "2025-10-18T10:30:00.000Z",
    updatedAt: "2025-12-28T15:00:00.000Z",
  },
  {
    id: "c-09",
    name: "Belal's Kitchen",
    phone: "+880 1519-887766",
    email: "belals.kitchen@gmail.com",
    address: "Banani, Dhaka",
    notes: "New customer - restaurant startup.",
    status: "active",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-19T09:45:00.000Z",
  },
  {
    id: "c-10",
    name: "Rashed Mobile Care",
    phone: "+880 1610-445566",
    address: "Farmgate, Dhaka",
    notes: "Servicing shop - parts stock lending.",
    status: "active",
    createdAt: "2026-06-12T13:20:00.000Z",
    updatedAt: "2026-08-16T18:10:00.000Z",
  },
];

/**
 * 41 transactions. Amounts and dates chosen so expected dues are easy to
 * verify by hand (see docs/progress.md G-26):
 *   c-01 → 4,500 · c-02 → 10,000 · c-03 → 0 (settled) · c-04 → −2,000 (advance)
 *   c-05 → 5,000 · c-06 → 25,000 · c-07 → 4,500 · c-08 → 0 (archived, settled)
 *   c-09 → 22,000 · c-10 → 5,000
 * Overview (active customers only, archived c-08 excluded): lent 262,000 ·
 * collected 188,000 · outstanding 74,000.
 */
export const MOCK_TRANSACTIONS: Transaction[] = [
  // c-01 Rahim Store - due 4,500
  { id: "t-001", customerId: "c-01", type: "lend", amount: 12000, date: "2026-07-04", method: "cash", note: "Weekly stock advance", createdAt: "2026-07-04T09:00:00.000Z" },
  { id: "t-002", customerId: "c-01", type: "repayment", amount: 5000, date: "2026-07-18", method: "mobile-banking", createdAt: "2026-07-18T10:30:00.000Z" },
  { id: "t-003", customerId: "c-01", type: "repayment", amount: 2500, date: "2026-08-12", method: "cash", createdAt: "2026-08-12T09:30:00.000Z" },

  // c-02 Karim Electronics - due 10,000
  { id: "t-004", customerId: "c-02", type: "lend", amount: 45000, date: "2026-05-02", method: "bank", note: "Television stock for Eid", createdAt: "2026-05-02T11:00:00.000Z" },
  { id: "t-005", customerId: "c-02", type: "repayment", amount: 15000, date: "2026-05-30", method: "bank", createdAt: "2026-05-30T14:20:00.000Z" },
  { id: "t-006", customerId: "c-02", type: "lend", amount: 12000, date: "2026-06-15", method: "cash", note: "Accessories restock", createdAt: "2026-06-15T10:10:00.000Z" },
  { id: "t-007", customerId: "c-02", type: "repayment", amount: 20000, date: "2026-07-10", method: "mobile-banking", createdAt: "2026-07-10T16:40:00.000Z" },
  { id: "t-008", customerId: "c-02", type: "repayment", amount: 8000, date: "2026-08-03", method: "cash", createdAt: "2026-08-03T12:00:00.000Z" },
  { id: "t-009", customerId: "c-02", type: "repayment", amount: 4000, date: "2026-08-19", method: "cash", note: "Morning drop-by", createdAt: "2026-08-19T11:15:00.000Z" },

  // c-03 Nusrat Jahan - settled (0)
  { id: "t-010", customerId: "c-03", type: "lend", amount: 8000, date: "2026-06-01", method: "cash", note: "Sewing machine repair", createdAt: "2026-06-01T09:45:00.000Z" },
  { id: "t-011", customerId: "c-03", type: "repayment", amount: 3000, date: "2026-06-20", method: "cash", createdAt: "2026-06-20T15:30:00.000Z" },
  { id: "t-012", customerId: "c-03", type: "repayment", amount: 5000, date: "2026-07-05", method: "mobile-banking", note: "Cleared in full", createdAt: "2026-07-05T16:45:00.000Z" },

  // c-04 Jamal Auto Parts - advance (−2,000)
  { id: "t-013", customerId: "c-04", type: "lend", amount: 20000, date: "2026-04-10", method: "bank", note: "Workshop tools", createdAt: "2026-04-10T13:00:00.000Z" },
  { id: "t-014", customerId: "c-04", type: "repayment", amount: 12000, date: "2026-05-05", method: "bank", createdAt: "2026-05-05T10:50:00.000Z" },
  { id: "t-015", customerId: "c-04", type: "repayment", amount: 5000, date: "2026-06-01", method: "cash", createdAt: "2026-06-01T11:35:00.000Z" },
  { id: "t-016", customerId: "c-04", type: "repayment", amount: 5000, date: "2026-06-18", method: "cash", note: "Rounded up - advance for next order", createdAt: "2026-06-18T10:20:00.000Z" },

  // c-05 Shirin Cosmetics - due 5,000
  { id: "t-017", customerId: "c-05", type: "lend", amount: 15000, date: "2026-06-22", method: "cash", note: "Festive inventory", createdAt: "2026-06-22T09:20:00.000Z" },
  { id: "t-018", customerId: "c-05", type: "repayment", amount: 4000, date: "2026-07-01", method: "mobile-banking", createdAt: "2026-07-01T17:10:00.000Z" },
  { id: "t-019", customerId: "c-05", type: "repayment", amount: 3500, date: "2026-07-25", method: "cash", createdAt: "2026-07-25T12:25:00.000Z" },
  { id: "t-020", customerId: "c-05", type: "repayment", amount: 2000, date: "2026-08-05", method: "cash", createdAt: "2026-08-05T10:40:00.000Z" },
  { id: "t-021", customerId: "c-05", type: "repayment", amount: 500, date: "2026-08-14", method: "cash", createdAt: "2026-08-14T13:05:00.000Z" },

  // c-06 Mannan Furniture Works - due 25,000
  { id: "t-022", customerId: "c-06", type: "lend", amount: 80000, date: "2025-12-05", method: "bank", note: "Mahogany order materials", createdAt: "2025-12-05T11:30:00.000Z" },
  { id: "t-023", customerId: "c-06", type: "repayment", amount: 25000, date: "2026-01-15", method: "bank", createdAt: "2026-01-15T15:00:00.000Z" },
  { id: "t-024", customerId: "c-06", type: "repayment", amount: 25000, date: "2026-02-20", method: "bank", createdAt: "2026-02-20T09:55:00.000Z" },
  { id: "t-025", customerId: "c-06", type: "lend", amount: 30000, date: "2026-03-12", method: "cash", note: "Second order - advance", createdAt: "2026-03-12T14:15:00.000Z" },
  { id: "t-026", customerId: "c-06", type: "repayment", amount: 20000, date: "2026-04-08", method: "bank", createdAt: "2026-04-08T10:05:00.000Z" },
  { id: "t-027", customerId: "c-06", type: "repayment", amount: 10000, date: "2026-05-10", method: "cash", createdAt: "2026-05-10T12:50:00.000Z" },
  { id: "t-028", customerId: "c-06", type: "repayment", amount: 5000, date: "2026-05-28", method: "mobile-banking", createdAt: "2026-05-28T17:30:00.000Z" },

  // c-07 Farhana Stationery - due 4,500
  { id: "t-029", customerId: "c-07", type: "lend", amount: 6000, date: "2026-08-05", method: "cash", note: "Exam-season stock", createdAt: "2026-08-05T08:55:00.000Z" },
  { id: "t-030", customerId: "c-07", type: "repayment", amount: 1000, date: "2026-08-11", method: "cash", createdAt: "2026-08-11T14:30:00.000Z" },
  { id: "t-031", customerId: "c-07", type: "repayment", amount: 500, date: "2026-08-17", method: "mobile-banking", createdAt: "2026-08-17T12:00:00.000Z" },

  // c-08 Sattar & Sons - archived, settled (0)
  { id: "t-032", customerId: "c-08", type: "lend", amount: 35000, date: "2025-11-10", method: "bank", note: "Wholesale rice lot", createdAt: "2025-11-10T10:45:00.000Z" },
  { id: "t-033", customerId: "c-08", type: "repayment", amount: 15000, date: "2025-11-30", method: "bank", createdAt: "2025-11-30T16:00:00.000Z" },
  { id: "t-034", customerId: "c-08", type: "repayment", amount: 10000, date: "2025-12-15", method: "cash", createdAt: "2025-12-15T11:25:00.000Z" },
  { id: "t-035", customerId: "c-08", type: "repayment", amount: 10000, date: "2025-12-28", method: "bank", note: "Cleared in full", createdAt: "2025-12-28T15:00:00.000Z" },

  // c-09 Belal's Kitchen - due 22,000 (lent today)
  { id: "t-036", customerId: "c-09", type: "lend", amount: 22000, date: "2026-08-19", method: "bank", note: "Kitchen equipment", createdAt: "2026-08-19T09:45:00.000Z" },

  // c-10 Rashed Mobile Care - due 5,000
  { id: "t-037", customerId: "c-10", type: "lend", amount: 9500, date: "2026-07-08", method: "cash", note: "Battery stock", createdAt: "2026-07-08T13:40:00.000Z" },
  { id: "t-038", customerId: "c-10", type: "repayment", amount: 3000, date: "2026-07-20", method: "cash", createdAt: "2026-07-20T10:15:00.000Z" },
  { id: "t-039", customerId: "c-10", type: "lend", amount: 2500, date: "2026-07-29", method: "cash", note: "Screen protectors", createdAt: "2026-07-29T15:55:00.000Z" },
  { id: "t-040", customerId: "c-10", type: "repayment", amount: 2000, date: "2026-08-09", method: "mobile-banking", createdAt: "2026-08-09T12:35:00.000Z" },
  { id: "t-041", customerId: "c-10", type: "repayment", amount: 2000, date: "2026-08-16", method: "cash", createdAt: "2026-08-16T18:10:00.000Z" },
];
