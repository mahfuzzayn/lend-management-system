"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { CustomerPicker } from "@/components/shared/customer-picker";
import { DatePickerField } from "@/components/shared/date-picker";
import { Button } from "@/components/ui/button";
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
import { cn, formatCurrency, methodLabel } from "@/lib/utils";
import { fieldErrors, transactionSchema } from "@/schemas";
import type { Customer, PaymentMethod, Transaction, TransactionType } from "@/types";

const METHODS: PaymentMethod[] = ["cash", "bank", "mobile-banking", "other"];
/** Fixed staff suggestions for "Added by" (works.md F20) - free text stays allowed. */
const ADDED_BY_CHOICES = ["Mahfuz Zayn", "Murshad Milad", "Mihad Ahmod"];
/** Local-calendar today (YYYY-MM-DD) - en-CA yields ISO order. UTC-based
 *  toISOString would block the user's real "today" after ~6 pm in UTC+6. */
const TODAY = () => new Date().toLocaleDateString("en-CA");

/**
 * Free-text input with a fixed suggestion dropdown (works.md F20): pick a
 * known name or type anything. The list renders INSIDE the dialog content
 * (no portal), so stacking with the modal is a non-issue.
 */
function AddedByField({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = ADDED_BY_CHOICES.filter(
    (name) =>
      name.toLowerCase().includes(value.trim().toLowerCase()) &&
      name.toLowerCase() !== value.trim().toLowerCase()
  );

  return (
    <div className="relative flex flex-col gap-2">
      <Label htmlFor="transaction-added-by">
        Added by <span className="text-muted-foreground">(optional)</span>
      </Label>
      <div className="relative">
        <Input
          id="transaction-added-by"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder="Defaults to you"
          aria-invalid={invalid}
          autoComplete="off"
          className="pr-8"
        />
        <button
          type="button"
          aria-label="Suggested names"
          aria-expanded={open && suggestions.length > 0}
          onMouseDown={(e) => e.preventDefault()} // keep the input's focus
          onClick={() => setOpen((next) => !next)}
          className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5" />
        </button>
        {open && suggestions.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-30 mt-1 rounded-lg border bg-popover p-1 shadow-md">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                // Prevent the input's blur so the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  transaction?: Transaction | null;
  /** When set (customer detail quick-add), the customer is locked to this one. */
  fixedCustomer?: Customer | null;
  /** Label for the picker when editing (code + name), so it never shows bare ids. */
  customerLabel?: string;
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
  customerLabel,
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
          customerLabel={customerLabel}
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
  customerLabel,
  onOpenChange,
  onSaved,
}: {
  transaction: Transaction | null;
  fixedCustomer: Customer | null;
  customerLabel?: string;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const editing = Boolean(transaction);

  const [customerId, setCustomerId] = useState(
    () => transaction?.customerId ?? fixedCustomer?.id ?? ""
  );
  const [type, setType] = useState<TransactionType>(() => transaction?.type ?? "lend");
  const [amount, setAmount] = useState(() => (transaction ? String(transaction.amount) : ""));
  const [date, setDate] = useState(() => transaction?.date.slice(0, 10) ?? TODAY());
  const [method, setMethod] = useState<PaymentMethod>(() => transaction?.method ?? "cash");
  const [note, setNote] = useState(() => transaction?.note ?? "");
  const [addedBy, setAddedBy] = useState(() => transaction?.addedBy ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

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

    // Optional extras default to empty, mirroring the API's parse (§5.3): the
    // schema types them as strings, so a form that omits them would fail
    // validation on keys the UI never shows (works.md #1).
    const parsed = transactionSchema.safeParse({
      referenceCode: "",
      productCategory: "",
      verificationStatus: "",
      referenceSource: "",
      customerId,
      type,
      amount: amountNumber,
      date,
      method,
      note,
      addedBy,
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
          <div className="flex h-9 items-center justify-between rounded-md border bg-muted/40 px-2.5">
            <span className="text-xs font-medium">{fixedCustomer.name}</span>
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
              locked
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-customer">Customer</Label>
          <CustomerPicker
            id="transaction-customer"
            value={customerId}
            selectedLabel={customerLabel}
            onChange={(v) => {
              setCustomerId(v);
              clearError("customerId");
            }}
            aria-invalid={Boolean(errors.customerId)}
          />
          {errors.customerId && (
            <p className="text-[0.625rem] text-destructive">{errors.customerId}</p>
          )}
        </div>
      )}

      {/* Type - segmented */}
      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 rounded-md border p-1" role="radiogroup" aria-label="Transaction type">
          {(["lend", "repayment"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => setType(option)}
              className={cn(
                "flex h-7 items-center justify-center gap-1.5 rounded-xs text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
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

        <DatePickerField
          id="transaction-date"
          label="Date"
          value={date}
          onChange={(v) => {
            setDate(v);
            clearError("date");
          }}
          max={TODAY()}
          aria-invalid={Boolean(errors.date)}
        />
      </div>
      {errors.date && <p className="-mt-2 text-[0.625rem] text-destructive">{errors.date}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transaction-method">Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
            <SelectTrigger id="transaction-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {methodLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AddedByField
          value={addedBy}
          onChange={(next) => {
            setAddedBy(next);
            clearError("addedBy");
          }}
          invalid={Boolean(errors.addedBy)}
        />
        {errors.addedBy && <p className="-mt-2 text-[0.625rem] text-destructive">{errors.addedBy}</p>}
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
