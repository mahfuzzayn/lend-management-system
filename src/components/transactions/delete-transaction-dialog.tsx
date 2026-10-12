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
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionWithCustomer } from "@/types";

interface DeleteTransactionDialogProps {
  transaction: TransactionWithCustomer | null;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion so the caller can refetch. */
  onDeleted?: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
  onDeleted,
}: DeleteTransactionDialogProps) {
  const [pending, setPending] = useState(false);
  const open = Boolean(transaction);

  async function handleConfirm() {
    if (!transaction) return;
    setPending(true);
    try {
      await api.deleteTransaction(transaction.id);
      onOpenChange(false);
      toast.success("Transaction deleted", {
        description: "Dues and balances have been recalculated.",
      });
      onDeleted?.();
    } catch (error) {
      toast.error("Entry was not deleted.", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setPending(false);
    }
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
