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
import type { Customer } from "@/types";

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  /** Transaction count to state in the warning (derived by the caller, when known). */
  transactionCount?: number;
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
    try {
      const { transactionsDeleted: transactionsRemoved } = await api.deleteCustomer(customer.id);
      onOpenChange(false);
      toast.success("Customer deleted", {
        description:
          transactionsRemoved > 0
            ? `${customer.name} and ${transactionsRemoved} transaction${transactionsRemoved > 1 ? "s" : ""} removed permanently.`
            : `${customer.name} removed permanently.`,
      });
      onDeleted?.(customer.id);
    } catch (error) {
      toast.error("Customer was not deleted.", {
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
          <AlertDialogTitle>Delete {customer?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the customer
            {transactionCount
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
