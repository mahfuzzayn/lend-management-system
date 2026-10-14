/**
 * Master-sheet import (requirements §5.6): `npm run import-csv [-- --dry-run]`
 *
 * Reads the Mihad Traders CSVs from docs/data and loads them into MongoDB:
 *   - Customers.csv + Due Summary.csv  -> customers (code, business fields,
 *     risk/recovery) joined on customer ID
 *   - Transactions.csv                 -> ledger rows (Payment -> repayment)
 *   - lifetime totals                  -> one opening lend + one opening
 *     repayment row per customer, dated 2026-01-01 (§5.6 for the math)
 *
 * The import is ADDITIVE and idempotent-guarded: it aborts if any C0## code
 * already exists, never wipes existing rows, and resolves phone conflicts by
 * dropping the imported phone (reported) so the sparse unique index holds.
 *
 * `--dry-run` prints the full plan without writing anything.
 * Runs on Node's native TypeScript stripping (Node >= 22.18), like seed.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db.ts";
import AdminModel from "../src/models/Admin.ts";
import CustomerModel from "../src/models/Customer.ts";
import TransactionModel from "../src/models/Transaction.ts";

const DATA_DIR = path.join(process.cwd(), "docs", "data");
const OPENING_DATE = new Date("2026-01-01T00:00:00.000Z");

/** Minimal .env loader (same as seed.ts - dotenv is not in the approved stack). */
function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith("#")) continue;
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

/* --------------------------------------------------------------------------
 * CSV parsing (RFC-4180-ish state machine - the sheet also carries stray
 * quote junk like '01711…'' and """017…""", which pass through and get
 * cleaned per-field afterwards).
 * ------------------------------------------------------------------------ */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function readCsv(name: string): string[][] {
  return parseCsv(readFileSync(path.join(DATA_DIR, name), "utf-8"));
}

/* --------------------------------------------------------------------------
 * Field cleaning
 * ------------------------------------------------------------------------ */

/** Trimmed text; "", "N/A", "-" and whitespace-only become undefined. */
function cleanText(raw: string | undefined): string | undefined {
  const value = (raw ?? "").trim();
  if (!value || /^(n\/a|na|-)$/i.test(value)) return undefined;
  return value;
}

/** Extract a phone number out of quote-junk / labeled junk ("Bhai '017…'"). */
function cleanPhone(raw: string | undefined): string | undefined {
  const stripped = (raw ?? "").replace(/["']/g, " ").replace(/[^\d+\-\s()]/g, " ");
  const match = stripped.match(/\+?\d[\d\s\-()]{5,18}\d/);
  if (!match) return undefined;
  const phone = match[0].replace(/\s+/g, " ").trim();
  return phone.replace(/\D/g, "").length >= 6 ? phone : undefined;
}

/** "৳588,855.00" -> 588855 */
function parseAmount(raw: string | undefined): number | null {
  const value = (raw ?? "").replace(/[^\d.-]/g, "");
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** dd/mm/yyyy or dd/mm/yy (sheet mixes both) -> UTC midnight Date. */
function parseSheetDate(raw: string | undefined): Date | undefined {
  const match = (raw ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += year < 70 ? 2000 : 1900;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Money as an exact Decimal128 string - integers stay integral. */
function decimalString(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 100) / 100);
}

const BUSINESS_TYPE_MAP: Record<string, "workshop" | "contractor" | "retail-shop" | "company" | "individual"> = {
  Workshop: "workshop",
  Contractor: "contractor",
  "Retail Shop": "retail-shop",
  Company: "company",
  Individual: "individual",
};

const RISK_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

const RECOVERY_MAP: Record<
  string,
  "not-contacted" | "contacted" | "promise-made" | "partial-payment" | "completed" | "refused" | "disputed" | "legal-action"
> = {
  "Not Contacted": "not-contacted",
  Contacted: "contacted",
  "Promise Made": "promise-made",
  "Partial Payment": "partial-payment",
  Completed: "completed",
  Refused: "refused",
  Disputed: "disputed",
  "Legal Action": "legal-action",
};

/* --------------------------------------------------------------------------
 * Sheet readers
 * ------------------------------------------------------------------------ */

interface SheetCustomer {
  code: string;
  name: string;
  businessName?: string;
  phone?: string;
  alternativePhone?: string;
  address?: string;
  area?: string;
  businessType?: "workshop" | "contractor" | "retail-shop" | "company" | "individual";
}

function readCustomers(): SheetCustomer[] {
  const rows = readCsv("Master File_ Mihad Traders Since 2026 - Customers.csv").slice(1);
  const customers: SheetCustomer[] = [];
  const seen = new Set<string>();
  /** Duplicated C002 row is really C003 (Due Summary joins on that key). */
  let c002Duplicate = 0;

  for (const row of rows) {
    let code = (row[0] ?? "").trim().toUpperCase();
    if (!code) continue;
    if (code === "C002" && seen.has(code)) {
      c002Duplicate += 1;
      code = `C00${2 + c002Duplicate}`; // second occurrence -> C003
    }
    seen.add(code);

    const businessName = cleanText(row[2]);
    let name = cleanText(row[1]) ?? businessName;
    if (!name) continue; // fully empty row (e.g. blank C095)
    name = name.slice(0, 80);

    // Cap every text at its model limit so one long cell can't fail the run.
    const cap = (value: string | undefined, max: number) =>
      value ? value.slice(0, max) : undefined;

    customers.push({
      code,
      name,
      businessName:
        businessName && businessName !== name ? cap(businessName, 120) : undefined,
      phone: cleanPhone(row[3]),
      alternativePhone: cleanPhone(row[4]),
      address: cap(cleanText(row[5]), 240),
      area: cap(cleanText(row[6]), 120),
      businessType: BUSINESS_TYPE_MAP[cleanText(row[7]) ?? ""],
    });
  }
  return customers;
}

interface SheetDue {
  code: string;
  totalCredit: number;
  totalPayment: number;
  statedDue: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  recoveryStatus?:
    | "not-contacted" | "contacted" | "promise-made" | "partial-payment"
    | "completed" | "refused" | "disputed" | "legal-action";
}

function readDueSummary(): { dues: Map<string, SheetDue>; sheetTotals: { lifetimeDue: number; currentDue: number; payment: number } } {
  const rows = readCsv("Master File_ Mihad Traders Since 2026 - Due Summary.csv");
  const dues = new Map<string, SheetDue>();
  const sheetTotals = { lifetimeDue: 0, currentDue: 0, payment: 0 };

  for (const [i, row] of rows.entries()) {
    // Side block on the first data rows: J/K hold the lifetime totals.
    if (i > 0 && i <= 3) {
      const label = (row[9] ?? "").trim();
      const value = parseAmount(row[10]);
      if (label === "Total Due (Lifetime)" && value !== null) sheetTotals.lifetimeDue = value;
      if (label === "Total Current Due" && value !== null) sheetTotals.currentDue = value;
      if (label === "Total Payment" && value !== null) sheetTotals.payment = value;
    }
    if (i === 0) continue; // header

    const code = (row[0] ?? "").trim().toUpperCase();
    if (!code || !/^C\d+$/.test(code)) continue;
    const totalCredit = parseAmount(row[2]) ?? 0;
    const totalPayment = parseAmount(row[3]) ?? 0;
    const statedDue = parseAmount(row[4]) ?? 0;
    if (dues.has(code)) continue; // sheet has stray duplicates - keep the first
    dues.set(code, {
      code,
      totalCredit,
      totalPayment,
      statedDue,
      riskLevel: RISK_MAP[cleanText(row[6]) ?? ""],
      recoveryStatus: RECOVERY_MAP[cleanText(row[7]) ?? ""],
    });
  }
  return { dues, sheetTotals };
}

interface SheetTransaction {
  referenceCode: string;
  date: Date;
  customerCode: string;
  type: "lend" | "repayment";
  amount: number;
  method: "cash" | "bank" | "mobile-banking" | "other";
  note?: string;
  addedBy?: string;
}

/** bKash -> mobile-banking; Cash -> cash; Bank -> bank; anything else -> other. */
function methodOf(sheetMethod: string): "cash" | "bank" | "mobile-banking" | "other" {
  const method = sheetMethod.trim().toLowerCase();
  if (method === "cash") return "cash";
  if (method === "bkash") return "mobile-banking";
  if (method === "bank" || method === "bank-transfer") return "bank";
  return "other";
}

function readTransactions(): SheetTransaction[] {
  const rows = readCsv("Master File_ Mihad Traders Since 2026 - Transactions.csv").slice(1);
  const transactions: SheetTransaction[] = [];

  for (const row of rows) {
    const date = parseSheetDate(row[1]);
    const customerCode = (row[2] ?? "").trim().toUpperCase();
    const amount = parseAmount(row[4]);
    if (!date || !customerCode || amount === null || amount <= 0) continue; // empty TRX rows

    // TRXOO2 uses letter O's - normalize to digits (reference codes only).
    const referenceCode = (row[0] ?? "").trim().toUpperCase().replace(/O/g, "0").slice(0, 20);
    const sheetType = (row[3] ?? "").trim().toLowerCase();

    transactions.push({
      referenceCode,
      date,
      customerCode,
      type: sheetType === "credit" ? "lend" : "repayment",
      amount,
      method: methodOf(row[7] ?? ""),
      note: cleanText(row[6])?.slice(0, 240),
      addedBy: cleanText(row[9])?.slice(0, 60),
    });
  }
  return transactions;
}

/* --------------------------------------------------------------------------
 * Import
 * ------------------------------------------------------------------------ */

interface PlannedRow {
  code: string;
  openingLend: number;
  openingRepayment: number;
  importedPayments: number;
  derivedDue: number;
  statedDue: number;
  phoneDropped: boolean;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  loadEnvFile();

  const sheetCustomers = readCustomers();
  const { dues: sheetDues, sheetTotals } = readDueSummary();
  const sheetTransactions = readTransactions();

  console.log(
    `Parsed: ${sheetCustomers.length} customers, ${sheetDues.size} due rows, ${sheetTransactions.length} transactions.`
  );
  if (dryRun) console.log("(dry run - nothing will be written)\n");

  // --- Pre-flight: codes must not already exist --------------------------
  await connectToDatabase();
  console.log("Connected to MongoDB.");

  const existingCodes = await CustomerModel.distinct("customerCode", {
    customerCode: { $in: sheetCustomers.map((c) => c.code) },
  });
  if (existingCodes.length > 0) {
    throw new Error(
      `Customers already imported (${existingCodes.join(", ")}…) - this import is additive-only. ` +
        `Remove them first if you really mean to re-import.`
    );
  }

  // --- Phone conflict resolution ------------------------------------------
  const existingPhones = new Set(
    (await CustomerModel.distinct("phone", { phone: { $ne: null } })).map((p) =>
      String(p).replace(/\s+/g, "")
    )
  );
  const plan: PlannedRow[] = [];
  const warnings: string[] = [];
  const usedPhones = new Set<string>();

  for (const customer of sheetCustomers) {
    let phoneDropped = false;
    if (customer.phone) {
      const key = customer.phone.replace(/\s+/g, "");
      if (existingPhones.has(key) || usedPhones.has(key)) {
        warnings.push(
          `${customer.code} ${customer.name}: phone ${customer.phone} already used - imported without a phone.`
        );
        phoneDropped = true;
        customer.phone = undefined;
      } else {
        usedPhones.add(key);
      }
    }

    const due = sheetDues.get(customer.code);
    const importedPayments = sheetTransactions
      .filter((t) => t.customerCode === customer.code && t.type === "repayment")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = due?.totalCredit ?? 0;
    const totalPayment = due?.totalPayment ?? 0;
    // §5.6: lifetime credit must at least cover the imported payments.
    const openingLend = Math.max(totalCredit, importedPayments);
    const openingRepayment = Math.max(0, totalPayment - importedPayments);
    const derivedDue = openingLend - openingRepayment - importedPayments;

    plan.push({
      code: customer.code,
      openingLend,
      openingRepayment,
      importedPayments,
      derivedDue,
      statedDue: due?.statedDue ?? 0,
      phoneDropped,
    });
  }

  // --- Report ---------------------------------------------------------------
  const mismatched = plan.filter(
    (p) => Math.abs(p.derivedDue - p.statedDue) > 0.5 && p.statedDue > 0
  );
  const totals = plan.reduce(
    (acc, p) => ({
      openingLend: acc.openingLend + p.openingLend,
      openingRepayment: acc.openingRepayment + p.openingRepayment,
      payments: acc.payments + p.importedPayments,
      due: acc.due + p.derivedDue,
    }),
    { openingLend: 0, openingRepayment: 0, payments: 0, due: 0 }
  );

  console.log("\n=== Import plan ===");
  console.log(`Customers to insert:        ${plan.length}`);
  console.log(`Sheet transactions:         ${sheetTransactions.length} (all repayments from Jul-Sep 2026)`);
  console.log(`Opening lend rows:          ${plan.filter((p) => p.openingLend > 0).length} (Σ ৳${totals.openingLend.toLocaleString("en-IN")})`);
  console.log(`Opening repayment rows:     ${plan.filter((p) => p.openingRepayment > 0).length} (Σ ৳${totals.openingRepayment.toLocaleString("en-IN")})`);
  console.log(`Derived outstanding (all):  ৳${totals.due.toLocaleString("en-IN")}`);
  console.log(`Sheet side-block totals:    due(lifetime) ৳${sheetTotals.lifetimeDue.toLocaleString("en-IN")} · current ৳${sheetTotals.currentDue.toLocaleString("en-IN")} · payments ৳${sheetTotals.payment.toLocaleString("en-IN")}`);

  if (warnings.length > 0) {
    console.log(`\nPhone conflicts (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (mismatched.length > 0) {
    console.log(
      `\nDue mismatches vs sheet (${mismatched.length}) - derived math wins (§5.6):`
    );
    for (const p of mismatched.slice(0, 15)) {
      console.log(
        `  - ${p.code}: sheet ৳${p.statedDue.toLocaleString("en-IN")} -> derived ৳${p.derivedDue.toLocaleString("en-IN")}`
      );
    }
    if (mismatched.length > 15) console.log(`  … and ${mismatched.length - 15} more`);
  }

  if (dryRun) {
    console.log("\nDry run complete - nothing written.");
    return;
  }

  // --- Write ----------------------------------------------------------------
  // 1. phone_1 unique index becomes sparse (missing phones are legal now).
  const collection = mongoose.connection.collection("customers");
  const indexes = await collection.indexes();
  const densePhone = indexes.find(
    (idx) => idx.key && (idx.key as Record<string, number>).phone === 1 && !idx.sparse
  );
  if (densePhone) {
    await collection.dropIndex(densePhone.name!);
    console.log(`Dropped dense phone index ${densePhone.name}.`);
  }
  await collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ customerCode: 1 }, { unique: true, sparse: true });
  console.log("Sparse unique indexes ensured (phone, customerCode).");

  const admin = await AdminModel.findOne({});
  if (!admin) throw new Error("No admin exists - run `npm run seed` first.");

  // 2. Customers (createdAt pinned to the master file's "Since 2026" start).
  const idByCode = new Map<string, mongoose.Types.ObjectId>();
  const customerDocs = sheetCustomers.map((customer) => {
    const _id = new mongoose.Types.ObjectId();
    idByCode.set(customer.code, _id);
    const due = sheetDues.get(customer.code);
    return {
      _id,
      name: customer.name,
      customerCode: customer.code,
      phone: customer.phone,
      businessName: customer.businessName,
      alternativePhone: customer.alternativePhone,
      address: customer.address,
      area: customer.area,
      businessType: customer.businessType,
      riskLevel: due?.riskLevel,
      recoveryStatus: due?.recoveryStatus,
      status: "active",
      createdAt: OPENING_DATE,
      updatedAt: OPENING_DATE,
    };
  });
  await CustomerModel.insertMany(customerDocs, { timestamps: false });
  console.log(`Inserted ${customerDocs.length} customers.`);

  // 3. Ledger: opening rows first, then the sheet transactions.
  interface TxDoc {
    customerId: mongoose.Types.ObjectId;
    type: "lend" | "repayment";
    amount: mongoose.Types.Decimal128;
    date: Date;
    method: "cash" | "bank" | "mobile-banking" | "other";
    note?: string;
    addedBy?: string;
    referenceCode?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  }

  const txDocs: TxDoc[] = [];
  for (const p of plan) {
    const customerId = idByCode.get(p.code);
    if (!customerId) continue;
    if (p.openingLend > 0) {
      txDocs.push({
        customerId,
        type: "lend",
        amount: mongoose.Types.Decimal128.fromString(decimalString(p.openingLend)),
        date: OPENING_DATE,
        method: "other",
        note: "Opening balance - lifetime credit from master sheet",
        addedBy: "Master sheet import",
        referenceCode: `OPEN-${p.code}`,
        createdBy: admin._id,
        createdAt: OPENING_DATE,
        updatedAt: OPENING_DATE,
      });
    }
    if (p.openingRepayment > 0) {
      txDocs.push({
        customerId,
        type: "repayment",
        amount: mongoose.Types.Decimal128.fromString(decimalString(p.openingRepayment)),
        date: OPENING_DATE,
        method: "other",
        note: "Opening balance - payments before the exported ledger",
        addedBy: "Master sheet import",
        referenceCode: `OPEN-${p.code}-P`,
        createdBy: admin._id,
        createdAt: new Date("2026-01-01T00:00:00.001Z"),
        updatedAt: new Date("2026-01-01T00:00:00.001Z"),
      });
    }
  }

  for (const sheet of sheetTransactions) {
    const customerId = idByCode.get(sheet.customerCode);
    if (!customerId) {
      warnings.push(`Transaction ${sheet.referenceCode} references unknown ${sheet.customerCode} - skipped.`);
      continue;
    }
    txDocs.push({
      customerId,
      type: sheet.type,
      amount: mongoose.Types.Decimal128.fromString(decimalString(sheet.amount)),
      date: sheet.date,
      method: sheet.method,
      note: sheet.note,
      addedBy: sheet.addedBy,
      referenceCode: sheet.referenceCode,
      createdBy: admin._id,
      createdAt: sheet.date,
      updatedAt: sheet.date,
    });
  }
  await TransactionModel.insertMany(txDocs, { timestamps: false });
  console.log(`Inserted ${txDocs.length} transactions (incl. opening rows).`);

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warnings total - see above.`);
  }
  console.log("\nImport complete.");
}

main()
  .catch((error: unknown) => {
    console.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    void mongoose.disconnect();
  });
