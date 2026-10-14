/**
 * Client-side CSV/JSON export (requirements FR-9b). One shared exporter so
 * every surface (customers, transactions, dues, customer detail) produces
 * byte-compatible files: UTF-8 with a BOM so Excel renders ৳, RFC-4180
 * quoting, and raw spreadsheet-friendly values (no formatted currency).
 */

export type ExportFormat = "csv" | "json";

import { businessTypeLabel, methodLabel, recoveryStatusLabel, riskLabel } from "@/lib/utils";
import type { CustomerWithDue, TransactionWithCustomer } from "@/types";

export interface ExportColumn<Row> {
  header: string;
  value: (row: Row) => string | number | boolean | null | undefined;
}

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Quote when needed; double embedded quotes (RFC-4180).
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Serialize rows to CSV text (BOM included for Excel's ৳ support). */
export function toCsv<Row>(columns: ExportColumn<Row>[], rows: Row[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => csvCell(c.value(row))).join(","))
    .join("\n");
  return `\uFEFF${head}\n${body}\n`;
}

/** Trigger a browser download for any text payload. */
function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

/** Download an arbitrary JSON payload (e.g. the full customer detail). */
export function downloadJsonFile(basename: string, data: unknown, stamped = true): string {
  const suffix = stamped ? `-${new Date().toISOString().slice(0, 10)}` : "";
  const filename = `${basename}${suffix}.json`;
  downloadText(filename, JSON.stringify(data, null, 2), "application/json");
  return filename;
}

/** Download rows as CSV or JSON in the user's chosen format (FR-9b). */
export function downloadExport<Row>(
  format: ExportFormat,
  basename: string,
  columns: ExportColumn<Row>[],
  rows: Row[],
  stamped = true
): string {
  const suffix = stamped ? `-${new Date().toISOString().slice(0, 10)}` : "";
  if (format === "json") {
    // JSON keeps the full shape: headers as keys, per-row objects.
    const data = rows.map((row) => {
      const record: Record<string, string | number | boolean | null> = {};
      for (const column of columns) {
        record[column.header] = column.value(row) ?? null;
      }
      return record;
    });
    return downloadJsonFile(basename, data, stamped);
  }
  const filename = `${basename}${suffix}.csv`;
  downloadText(filename, toCsv(columns, rows), "text/csv");
  return filename;
}

/* ------------------------------------------------------------------------
 * Column definitions shared by every export surface (single source).
 * ---------------------------------------------------------------------- */

const dueStatusLabel = (due: number) => (due > 0 ? "due" : due < 0 ? "advance" : "settled");

const isoDay = (iso: string | null | undefined) => iso?.slice(0, 10) ?? "";

/** Customers table export - one row per customer with derived ledger totals. */
export function customerExportColumns(): ExportColumn<CustomerWithDue>[] {
  return [
    { header: "Customer Code", value: (c) => c.customerCode ?? "" },
    { header: "Customer Name", value: (c) => c.name },
    { header: "Business Name", value: (c) => c.businessName ?? "" },
    { header: "Phone Number", value: (c) => c.phone ?? "" },
    { header: "Alternative Phone", value: (c) => c.alternativePhone ?? "" },
    { header: "Email", value: (c) => c.email ?? "" },
    { header: "Address", value: (c) => c.address ?? "" },
    { header: "Area", value: (c) => c.area ?? "" },
    { header: "Business Type", value: (c) => (c.businessType ? businessTypeLabel(c.businessType) : "") },
    { header: "Customer Category", value: (c) => c.customerCategory ?? "" },
    { header: "Customer Since", value: (c) => isoDay(c.customerSince) },
    { header: "Status", value: (c) => c.status },
    { header: "Risk Level", value: (c) => (c.riskLevel ? riskLabel(c.riskLevel) : "") },
    { header: "Recovery Status", value: (c) => (c.recoveryStatus ? recoveryStatusLabel(c.recoveryStatus) : "") },
    { header: "Notes", value: (c) => c.notes ?? "" },
    { header: "Total Lent", value: (c) => c.totalLent },
    { header: "Total Received", value: (c) => c.totalReceived },
    { header: "Current Due", value: (c) => c.due },
    { header: "Due Status", value: (c) => dueStatusLabel(c.due) },
    { header: "Last Transaction Date", value: (c) => isoDay(c.lastTransactionDate) },
    { header: "Created At", value: (c) => isoDay(c.createdAt) },
  ];
}

/** Transactions export - one row per ledger entry. */
export function transactionExportColumns(): ExportColumn<TransactionWithCustomer>[] {
  return [
    { header: "Reference", value: (t) => t.referenceCode ?? "" },
    { header: "Date", value: (t) => isoDay(t.date) },
    { header: "Customer Code", value: (t) => t.customerCode ?? "" },
    { header: "Customer Name", value: (t) => t.customerName },
    { header: "Transaction Type", value: (t) => (t.type === "lend" ? "Credit" : "Payment") },
    { header: "Amount", value: (t) => t.amount },
    { header: "Payment Method", value: (t) => methodLabel(t.method) },
    { header: "Description", value: (t) => t.note ?? "" },
    { header: "Added By", value: (t) => t.addedBy ?? "" },
    { header: "Product Category", value: (t) => t.productCategory ?? "" },
    { header: "Verification Status", value: (t) => t.verificationStatus ?? "" },
    { header: "Reference Source", value: (t) => t.referenceSource ?? "" },
    { header: "Created At", value: (t) => isoDay(t.createdAt) },
  ];
}
