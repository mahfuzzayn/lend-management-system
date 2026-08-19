"use client";

import React from "react";
import { toast } from "sonner";
import type { DocumentProps } from "@react-pdf/renderer";

import { APP_NAME } from "@/lib/config";
import type { Customer, CustomerSummary, TransactionWithBalance } from "@/types";

/**
 * One-shot client-side PDF download for a customer's full current history
 * (requirements §10). The renderer is dynamically imported so its weight
 * stays out of the initial page bundle.
 */

export interface CustomerHistoryPdfInput {
  customer: Customer;
  summary: CustomerSummary;
  ledger: TransactionWithBalance[];
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "customer"
  );
}

export async function downloadCustomerHistoryPdf(input: CustomerHistoryPdfInput): Promise<string> {
  const filename = `${slugify(input.customer.name)}-history-${new Date().toISOString().slice(0, 10)}.pdf`;
  const toastId = toast.loading("Preparing the PDF…");

  try {
    const [{ pdf }, { CustomerHistoryDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("./customer-history-document"),
    ]);

    const generatedAt = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());

    const blob = await pdf(
      React.createElement(CustomerHistoryDocument, {
        customer: input.customer,
        summary: input.summary,
        ledger: input.ledger,
        appName: APP_NAME,
        generatedAt,
      }) as React.ReactElement<DocumentProps>
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);

    toast.success("History PDF downloaded", { id: toastId, description: filename });
    return filename;
  } catch (error) {
    console.error("PDF generation failed", error);
    toast.error("Couldn't generate the PDF.", {
      id: toastId,
      description: "Nothing was downloaded - try again.",
    });
    throw error;
  }
}
