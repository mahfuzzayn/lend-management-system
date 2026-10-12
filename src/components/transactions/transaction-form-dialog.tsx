"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, errorMessage } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { fieldErrors, transactionSchema } from "@/schemas";
import type { Customer, PaymentMethod, Transaction, TransactionType } from "@/types";

const METHODS: PaymentMethod[] = ["cash", "bank", "mobile-banking", "other"];
/** Local-calendar today (YYYY-MM-DD) - en-CA yields ISO order. UTC-based
 *  toISOString would block the user's real "today" after ~6 pm in UTC+6. */
const TODAY = () => new Date().toLocaleDateString("en-CA");

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  transaction?: Transaction | null;
  /** When set (customer detail quick-add), the customer is locked to this one. */
  fixedCustomer?: Customer | null;
  /** Called after a successful save so the caller can refetch. */
  onSaved?: () => void;
}

/**
 * The form lives inside DialogContent, so it unmounts on close and remounts
 * fresh (with new props) on every open - no reset effects needed.
 */
export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  fixedCustomer,
  onSaved,
}: TransactionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            {transaction
              ? "Correct the entry - dues recalculate immediately."
              : "Money given out is a lend, money received is a repayment."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          key={transaction?.id ?? (fixedCustomer ? `fixed-${fixedCustomer.id}` : "new")}
          transaction={transaction ?? null}
          fixedCustomer={fixedCustomer ?? null}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  transaction,
  fixedCustomer,
  onOpenChange,
  onSaved,
}: {
  transaction: Transaction | null;
  fixedCustomer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const editing = Boolean(transaction);

  // Customer picker options - only needed when the customer is pickable.
  useEffect(() => {
    if (fixedCustomer) return;
    let cancelled = false;
    api
      .listCustomers({ limit: 100 })
      .then((result) => {
        if (!cancelled) setCustomers(result.items);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error("Couldn't load customers.", { description: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [fixedCustomer]);

  const [customerId, setCustomerId] = useState(
    () => transaction?.customerId ?? fixedCustomer?.id ?? ""
  );
  const [type, setType] = useState<TransactionType>(() => transaction?.type ?? "lend");
  const [amount, setAmount] = useState(() => (transaction ? String(transaction.amount) : ""));
  const [date, setDate] = useState(() => transaction?.date ?? TODAY());
  const [method, setMethod] = useState<PaymentMethod>(() => transaction?.method ?? "cash");
  const [note, setNote] = useState(() => transaction?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  // The list endpoint returns active customers by default.
  const customerNameById = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers]
  );

  function clearError(field: string) {
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountNumber = Number(amount.trim());
    if (!amount.trim() || Number.isNaN(amountNumber)) {
      setErrors({ amount: "Enter a valid amount." });
      return;
    }

    const parsed = transactionSchema.safeParse({
      customerId,
      type,
      amount: amountNumber,
      date,
      method,
      note,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const data = parsed.data;

    setPending(true);
    try {
      if (editing && transaction) {
        await api.updateTransaction(transaction.id, data);
        toast.success("Transaction updated", {
          description: `${data.type === "lend" ? "Lend" : "Repayment"} of ${formatCurrency(data.amount)}`,
        });
      } else {
        await api.createTransaction(data);
        toast.success(data.type === "lend" ? "Lend recorded" : "Repayment recorded", {
          description: `${formatCurrency(data.amount)} · ${data.date}`,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error("Nothing was saved.", { description: errorMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Customer - locked when opened from a customer's page */}
      {fixedCustomer ? (
        <div className="flex flex-col gap-2">
          <Label>Customer</Label>
          <div className="flex h-8 items-center justify-between border bg-muted/40 px-2.5">
            <span className="text-xs font-medium">{fixedCustomer.name}</span>
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
              locked
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-customer">Customer</Label>
          <Combobox
            value={customerId}
            onValueChange={(v) => {
              setCustomerId(String(v));
              clearError("customerId");
            }}
            itemToStringLabel={(v) => customerNameById.get(String(v)) ?? ""}
          >
            <ComboboxInput
              id="transaction-customer"
              placeholder="Search or pick a customer…"
              className="w-full"
              aria-invalid={Boolean(errors.customerId)}
            />
            <ComboboxContent>
              <ComboboxList>
                {customers.map((c) => (
                  <ComboboxItem key={c.id} value={c.id}>
                    {c.name}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No customer matches.</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {errors.customerId && (
            <p className="text-[0.625rem] text-destructive">{errors.customerId}</p>
          )}
        </div>
      )}

      {/* Type - segmented */}
      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 border p-1" role="radiogroup" aria-label="Transaction type">
          {(["lend", "repayment"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => setType(option)}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                type === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5",
                  option === "lend" ? "bg-red-500" : "bg-emerald-500",
                  type !== option && "opacity-60"
                )}
                aria-hidden
              />
              {option === "lend" ? "Lend (money out)" : "Repayment (in)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
              ৳
            </span>
            <Input
              id="transaction-amount"
              inputMode="decimal"
              className="pl-6 font-mono tabular-nums"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clearError("amount");
              }}
              placeholder="0"
              aria-invalid={Boolean(errors.amount)}
            />
          </div>
          {errors.amount && (
            <p className="text-[0.625rem] text-destructive">{errors.amount}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-date">Date</Label>
          <Input
            id="transaction-date"
            type="date"
            value={date}
            max={TODAY()}
            onChange={(e) => {
              setDate(e.target.value);
              clearError("date");
            }}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date && <p className="text-[0.625rem] text-destructive">{errors.date}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="transaction-method">Method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <SelectTrigger id="transaction-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m} className="capitalize">
                {m === "mobile-banking" ? "Mobile banking" : m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="transaction-note">
          Note <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="transaction-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            clearError("note");
          }}
          placeholder="What was it for?"
          aria-invalid={Boolean(errors.note)}
        />
        {errors.note && <p className="text-[0.625rem] text-destructive">{errors.note}</p>}
      </div>

      <DialogFooter className="mt-2 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Record transaction"}
        </Button>
      </DialogFooter>
    </form>
  );
}
