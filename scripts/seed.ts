/**
 * Seed script (requirements §12): `npm run seed [-- --demo]`
 *
 * - Always upserts the first admin from ADMIN_NAME / ADMIN_EMAIL /
 *   ADMIN_PASSWORD env vars (bcrypt, cost 12 - requirements §11.1).
 * - `--demo` additionally replaces customers + transactions with the
 *   v1 mock dataset (10 customers / 41 transactions), preserving the
 *   original dates so the ledger history stays realistic.
 *
 * Loads .env manually (dotenv is not part of the approved stack) and runs
 * on Node's native TypeScript stripping (Node >= 22.18).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db.ts";
import AdminModel from "../src/models/Admin.ts";
import CustomerModel from "../src/models/Customer.ts";
import TransactionModel from "../src/models/Transaction.ts";
import { MOCK_CUSTOMERS, MOCK_TRANSACTIONS } from "./demo-data.ts";

/** Requirements §11.1 says cost >= 10; 12 adds a margin without hurting a single login. */
const BCRYPT_COST = 12;

/** Minimal .env loader: KEY=VALUE lines, "#" comments, never overrides real env. */
function loadEnvFile(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith("#")) continue;
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

async function seedAdmin(): Promise<mongoose.Types.ObjectId> {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!name || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example).");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const admin = await AdminModel.findOneAndUpdate(
    { email },
    { name, email, passwordHash },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  if (!admin) throw new Error("Failed to upsert the admin record.");

  console.log(`Admin seeded: ${admin.email}`);
  return admin._id;
}

async function seedDemoData(adminId: mongoose.Types.ObjectId): Promise<void> {
  const clearedCustomers = await CustomerModel.deleteMany({});
  const clearedTransactions = await TransactionModel.deleteMany({});
  console.log(
    `Cleared existing data - customers: ${clearedCustomers.deletedCount}, transactions: ${clearedTransactions.deletedCount}.`
  );

  const idByMockId = new Map<string, mongoose.Types.ObjectId>();

  const customerDocs = MOCK_CUSTOMERS.map((customer) => {
    const _id = new mongoose.Types.ObjectId();
    idByMockId.set(customer.id, _id);
    return {
      _id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      status: customer.status,
      // Preserve the mock dates - "customer since" must not become today.
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    };
  });
  await CustomerModel.insertMany(customerDocs, { timestamps: false });

  const transactionDocs = MOCK_TRANSACTIONS.map((t) => {
    const customerId = idByMockId.get(t.customerId);
    if (!customerId) throw new Error(`Demo data references unknown customer ${t.customerId}.`);
    const createdAt = new Date(t.createdAt);
    return {
      customerId,
      type: t.type,
      amount: mongoose.Types.Decimal128.fromString(String(t.amount)),
      // Mock dates are plain YYYY-MM-DD -> parsed as UTC midnight, stable everywhere.
      date: new Date(t.date),
      method: t.method,
      note: t.note,
      createdBy: adminId,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await TransactionModel.insertMany(transactionDocs, { timestamps: false });

  console.log(`Demo data inserted - customers: ${customerDocs.length}, transactions: ${transactionDocs.length}.`);
}

async function main(): Promise<void> {
  loadEnvFile();
  await connectToDatabase();
  console.log("Connected to MongoDB.");

  const adminId = await seedAdmin();

  if (process.argv.includes("--demo")) {
    await seedDemoData(adminId);
  } else {
    console.log("No --demo flag - sample data skipped.");
  }

  console.log("Seed complete.");
}

main()
  .catch((error: unknown) => {
    console.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    void mongoose.disconnect();
  });
