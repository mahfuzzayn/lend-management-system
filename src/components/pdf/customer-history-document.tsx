import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Customer, CustomerSummary, TransactionWithBalance } from "@/types";

/**
 * Declarative PDF for one customer's complete current history (requirements
 * §10). Rendered to a Blob client-side via `pdf()` - never in the DOM tree.
 *
 * Note: built-in PDF fonts are WinAnsi-encoded and cannot render the ৳ glyph,
 * so amounts inside the PDF use the "BDT" prefix (UI keeps ৳).
 */

const INK = "#1c1917"; // stone-900
const MUTED = "#78716c"; // stone-500
const BORDER = "#d6d3d1"; // stone-300
const SOFT = "#f5f5f4"; // stone-100
const RED = "#b91c1c";
const GREEN = "#047857";
const BLUE = "#1d4ed8";

const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function pdfCurrency(amount: number, { signed = false }: { signed?: boolean } = {}) {
  const sign = signed && amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}BDT ${numberFormat.format(Math.abs(amount))}`;
}

function outstandingWording(summary: CustomerSummary) {
  if (summary.dueStatus === "settled") return "Settled - nothing outstanding";
  if (summary.dueStatus === "advance")
    return `${pdfCurrency(Math.abs(summary.due))} in advance (overpaid)`;
  return pdfCurrency(summary.due);
}

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 56, paddingHorizontal: 48, fontSize: 9, fontFamily: "Helvetica", color: INK },
  row: { flexDirection: "row", alignItems: "center" },
  spread: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: -0.3 },
  brandSub: { fontSize: 9, color: MUTED, marginTop: 2 },
  generated: { fontSize: 8, color: MUTED },
  ruleHeavy: { height: 2, backgroundColor: INK, marginTop: 14, marginBottom: 16 },

  customerName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  customerMeta: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  customerSince: { fontSize: 8.5, color: MUTED, textAlign: "right" },

  summaryRow: { flexDirection: "row", marginTop: 16, marginBottom: 18, borderWidth: 1, borderColor: BORDER },
  summaryCell: { flex: 1, padding: 10, borderRightWidth: 1, borderColor: BORDER },
  summaryLabel: { fontSize: 7, letterSpacing: 1, color: MUTED, fontFamily: "Helvetica-Bold" },
  summaryValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 4 },

  tableHeader: { flexDirection: "row", backgroundColor: SOFT, borderWidth: 1, borderColor: BORDER, paddingVertical: 6, paddingHorizontal: 8, fontFamily: "Helvetica-Bold", fontSize: 7.5, letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: BORDER },
  cell: { fontSize: 8.5 },
  cellNum: { fontSize: 8.5, color: MUTED },
  cellNote: { fontSize: 8, color: MUTED },
  right: { textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },

  totalsRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, backgroundColor: SOFT, borderWidth: 1, borderColor: BORDER, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  totalsLabel: { fontSize: 7, letterSpacing: 1, color: MUTED, fontFamily: "Helvetica-Bold" },

  footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: BORDER, paddingTop: 6, fontSize: 7.5, color: MUTED },
});

const COL = { no: "4.5%", date: "12%", type: "10%", method: "13%", note: "31.5%", amount: "14%", balance: "15%" } as const;

export interface CustomerHistoryDocumentProps {
  customer: Customer;
  summary: CustomerSummary;
  ledger: TransactionWithBalance[];
  appName: string;
  /** Pre-formatted generation date, e.g. "19 Aug 2026". */
  generatedAt: string;
}

export function CustomerHistoryDocument({
  customer,
  summary,
  ledger,
  appName,
  generatedAt,
}: CustomerHistoryDocumentProps) {
  return (
    <Document title={`${customer.name} - Lending History`} author={appName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.spread}>
          <View>
            <Text style={styles.brand}>{appName}</Text>
            <Text style={styles.brandSub}>Customer Lending History</Text>
          </View>
          <Text style={styles.generated}>Generated {generatedAt}</Text>
        </View>
        <View style={styles.ruleHeavy} />

        {/* Customer block */}
        <View style={styles.spread}>
          <View>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerMeta}>{customer.phone}</Text>
            {customer.email ? <Text style={styles.customerMeta}>{customer.email}</Text> : null}
            {customer.address ? <Text style={styles.customerMeta}>{customer.address}</Text> : null}
          </View>
          <Text style={styles.customerSince}>
            Customer since{"\n"}
            {new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
        {customer.notes ? (
          <Text style={[styles.customerMeta, { marginTop: 6 }]}>Notes: {customer.notes}</Text>
        ) : null}

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCell, { borderRightWidth: 1 }]}>
            <Text style={styles.summaryLabel}>TOTAL LENT</Text>
            <Text style={styles.summaryValue}>{pdfCurrency(summary.totalLent)}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>TOTAL RECEIVED</Text>
            <Text style={[styles.summaryValue, { color: GREEN }]}>{pdfCurrency(summary.totalReceived)}</Text>
          </View>
          <View style={[styles.summaryCell, { borderRightWidth: 0 }]}>
            <Text style={styles.summaryLabel}>CURRENT OUTSTANDING</Text>
            <Text
              style={[
                styles.summaryValue,
                summary.dueStatus === "due" ? { color: RED } : undefined,
                summary.dueStatus === "advance" ? { color: BLUE } : undefined,
                summary.dueStatus === "settled" ? { color: GREEN } : undefined,
              ]}
            >
              {outstandingWording(summary)}
            </Text>
          </View>
        </View>

        {/* Ledger */}
        <View style={styles.tableHeader}>
          <Text style={{ width: COL.no }}>#</Text>
          <Text style={{ width: COL.date }}>DATE</Text>
          <Text style={{ width: COL.type }}>TYPE</Text>
          <Text style={{ width: COL.method }}>METHOD</Text>
          <Text style={{ width: COL.note }}>NOTE</Text>
          <Text style={{ width: COL.amount, textAlign: "right" }}>AMOUNT</Text>
          <Text style={{ width: COL.balance, textAlign: "right" }}>BALANCE</Text>
        </View>

        {ledger.map((row, index) => (
          <View
            key={row.id}
            style={[styles.tableRow, index % 2 === 1 ? { backgroundColor: SOFT } : undefined]}
          >
            <Text style={[styles.cellNum, { width: COL.no }]}>{index + 1}</Text>
            <Text style={[styles.cell, { width: COL.date }]}>
              {new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </Text>
            <Text style={[styles.cell, { width: COL.type }]}>{row.type === "lend" ? "Lend" : "Repayment"}</Text>
            <Text style={[styles.cell, { width: COL.method }]}>{row.method === "mobile-banking" ? "Mobile banking" : row.method.charAt(0).toUpperCase() + row.method.slice(1)}</Text>
            <Text style={[styles.cellNote, { width: COL.note }]}>{row.note ?? "-"}</Text>
            <Text
              style={[
                styles.cell,
                styles.right,
                { width: COL.amount },
                row.type === "repayment" ? { color: GREEN } : { color: INK },
              ]}
            >
              {pdfCurrency(row.type === "lend" ? -row.amount : row.amount, { signed: true })}
            </Text>
            <Text style={[styles.cell, styles.right, styles.bold, { width: COL.balance }]}>{pdfCurrency(row.balance)}</Text>
          </View>
        ))}

        {ledger.length === 0 ? (
          <Text style={[styles.cellNote, { textAlign: "center", paddingVertical: 18 }]}>
            No transactions recorded yet.
          </Text>
        ) : (
          <View style={styles.totalsRow}>
            {/* no + date + type + method + note = 71% of the row width */}
            <Text style={[styles.totalsLabel, { width: "71%" }]}>TOTALS</Text>
            <Text style={{ width: COL.amount, textAlign: "right", color: GREEN }}>
              {pdfCurrency(summary.totalReceived, { signed: true })}
            </Text>
            <Text style={{ width: COL.balance, textAlign: "right" }}>
              {pdfCurrency(summary.due)}
            </Text>
          </View>
        )}

        {/* Footer with page numbers */}
        <View style={styles.footer} fixed>
          <Text>Generated by {appName} - lend management system</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
