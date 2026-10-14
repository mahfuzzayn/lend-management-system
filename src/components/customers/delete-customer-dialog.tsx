"use client";

import { useEffect, useState } from "react";
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
  /** true = super-admin permanent delete from the Trash (§5.7); default = soft delete. */
  purge?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful deletion (e.g. navigate back to the list). */
  onDeleted?: (id: string) => void;
}

export function DeleteCustomerDialog({
  customer,
  transactionCount,
  purge = false,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const [pending, setPending] = useState(false);
  // The cascade warning should always carry the real count (works.md #1);
  // list callers don't have it, so fetch it once per customer when missing.
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);
  const open = Boolean(customer);

  useEffect(() => {
    if (!customer || transactionCount !== undefined) return;
    let cancelled = false;
    api
      .listTransactions({ customerId: customer.id, limit: 1 })
      .then((result) => {
        if (!cancelled) setFetchedCount(result.total);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [customer, transactionCount]);

  const count = transactionCount ?? fetchedCount;

  async function handleConfirm() {
    if (!customer) return;
    setPending(true);
    try {
      if (purge) {
        const { transactionsDeleted = 0 } = await api.deleteCustomer(customer.id, { purge: true });
        onOpenChange(false);
        toast.success("Customer permanently deleted", {
          description:
            transactionsDeleted > 0
              ? `${customer.name} and ${transactionsDeleted} transaction${
                  transactionsDeleted > 1 ? "s" : ""
                } removed for good.`
              : `${customer.name} removed for good.`,
        });
      } else {
        const { transactionsTrashed } = await api.deleteCustomer(customer.id);
        onOpenChange(false);
        toast.success("Customer moved to trash", {
          description:
            transactionsTrashed && transactionsTrashed > 0
              ? `${customer.name} and ${transactionsTrashed} transaction${
                  transactionsTrashed > 1 ? "s" : ""
                } wait in the trash - restore anytime.`
              : `${customer.name} waits in the trash - restore anytime.`,
        });
      }
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
          <AlertDialogTitle>
            {purge ? `Permanently delete ${customer?.name}?` : `Move ${customer?.name} to trash?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {purge ? (
              <>
                This removes the customer
                {count !== null
                  ? ` and their ${count} transaction${count > 1 ? "s" : ""}`
                  : " and their transaction history"}{" "}
                for good - nothing can bring them back.
              </>
            ) : (
              <>
                They leave every list and total now
                {count !== null
                  ? `, together with their ${count} transaction${count > 1 ? "s" : ""}`
                  : ", together with their transaction history"}
                , and wait in the trash where any admin can restore them - the
                transactions come back only with the customer. Only a super
                admin can delete permanently.
              </>
            )}
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
            {pending ? "Deleting…" : purge ? "Delete permanently" : "Move to trash"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
