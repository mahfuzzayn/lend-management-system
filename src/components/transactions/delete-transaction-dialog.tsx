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
  /** true = super-admin permanent delete from the Trash (§5.7); default = soft delete. */
  purge?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion so the caller can refetch. */
  onDeleted?: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  purge = false,
  onOpenChange,
  onDeleted,
}: DeleteTransactionDialogProps) {
  const [pending, setPending] = useState(false);
  const open = Boolean(transaction);

  async function handleConfirm() {
    if (!transaction) return;
    setPending(true);
    try {
      if (purge) {
        await api.deleteTransaction(transaction.id, { purge: true });
        onOpenChange(false);
        toast.success("Entry permanently deleted", {
          description: "It is gone for good - the ledger recalculated without it.",
        });
      } else {
        await api.deleteTransaction(transaction.id);
        onOpenChange(false);
        toast.success("Entry moved to trash", {
          description: "Dues and balances recalculated; restore it from the trash anytime.",
        });
      }
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
            {purge
              ? "Permanently delete this entry?"
              : `Move this ${
                  transaction ? (transaction.type === "lend" ? "lend" : "repayment") : "entry"
                } to trash?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {transaction && (
              <>
                {formatCurrency(transaction.amount)} · {transaction.customerName} ·{" "}
                {formatDate(transaction.date)}.{" "}
                {purge
                  ? "It is gone for good once confirmed."
                  : "The ledger recalculates immediately; any admin can restore it from the trash."}
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
            {pending ? "Deleting…" : purge ? "Delete permanently" : "Move to trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
