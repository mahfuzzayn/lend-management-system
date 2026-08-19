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
import { deleteCustomerCascade } from "@/lib/mock-store";
import type { Customer } from "@/types";

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  /** Transaction count to state in the warning (derived by the caller). */
  transactionCount: number;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion (e.g. navigate back to the list). */
  onDeleted?: (id: string) => void;
}

export function DeleteCustomerDialog({
  customer,
  transactionCount,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const [pending, setPending] = useState(false);
  const open = Boolean(customer);

  async function handleConfirm() {
    if (!customer) return;
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 250)); // simulated latency
    const { transactionsRemoved } = deleteCustomerCascade(customer.id);
    setPending(false);
    onOpenChange(false);
    toast.success("Customer deleted", {
      description:
        transactionsRemoved > 0
          ? `${customer.name} and ${transactionsRemoved} transaction${transactionsRemoved > 1 ? "s" : ""} removed permanently.`
          : `${customer.name} removed permanently.`,
    });
    onDeleted?.(customer.id);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {customer?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the customer
            {transactionCount > 0
              ? ` and their ${transactionCount} transaction${transactionCount > 1 ? "s" : ""}`
              : " and their transaction history"}
            . Dues and history cannot be recovered afterwards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep customer</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault(); // keep the dialog open while pending
              void handleConfirm();
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
