"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTransaction } from "@/lib/mock-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionWithCustomer } from "@/types";

interface DeleteTransactionDialogProps {
  transaction: TransactionWithCustomer | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
}: DeleteTransactionDialogProps) {
  const [pending, setPending] = useState(false);
  const open = Boolean(transaction);

  async function handleConfirm() {
    if (!transaction) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 250)); // simulated latency
    deleteTransaction(transaction.id);
    setPending(false);
    onOpenChange(false);
    toast.success("Transaction deleted", {
      description: "Dues and balances have been recalculated.",
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete this {transaction ? (transaction.type === "lend" ? "lend" : "repayment") : "entry"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {transaction && (
              <>
                {formatCurrency(transaction.amount)} · {transaction.customerName} ·{" "}
                {formatDate(transaction.date)}. The ledger recalculates immediately -
                this cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep entry</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault(); // keep the dialog open while pending
              void handleConfirm();
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Deleting…" : "Delete entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
