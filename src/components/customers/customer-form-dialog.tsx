"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { customerSchema, fieldErrors } from "@/schemas";
import type { Customer } from "@/types";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  customer?: Customer | null;
  /** Called after a successful save so the caller can refetch. */
  onSaved?: () => void;
}

/**
 * The form lives inside DialogContent, so it unmounts on close and remounts
 * fresh (with new props) on every open - no reset effects needed.
 */
export function CustomerFormDialog({ open, onOpenChange, customer, onSaved }: CustomerFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {customer
              ? "Update the record - ledger history stays untouched."
              : "A name and phone number is all a ledger needs to start."}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          key={customer?.id ?? "new"}
          customer={customer ?? null}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const EMPTY: FormState = { name: "", phone: "", email: "", address: "", notes: "" };

function CustomerForm({
  customer,
  onOpenChange,
  onSaved,
}: {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const editing = Boolean(customer);
  const [values, setValues] = useState<FormState>(
    () =>
      customer
        ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
          }
        : EMPTY
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set(field: keyof FormState, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    const data = parsed.data;

    setPending(true);
    try {
      if (editing && customer) {
        await api.updateCustomer(customer.id, data);
        toast.success("Customer updated", { description: data.name });
      } else {
        const created = await api.createCustomer(data);
        toast.success("Customer added", { description: created.name });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setErrors({ phone: error.message });
      } else {
        toast.error("Nothing was saved.", { description: errorMessage(error) });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-name">Name</Label>
        <Input
          id="customer-name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Rahim Store"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="text-[0.625rem] text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input
          id="customer-phone"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+880 1712-458900"
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && <p className="text-[0.625rem] text-destructive">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-email">
          E-mail <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="customer-email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="store@example.com"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="text-[0.625rem] text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-address">
          Address <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="customer-address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="New Market, Dhaka"
          aria-invalid={Boolean(errors.address)}
        />
        {errors.address && (
          <p className="text-[0.625rem] text-destructive">{errors.address}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-notes">
          Notes <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="customer-notes"
          rows={3}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Why they borrow, how they repay…"
          aria-invalid={Boolean(errors.notes)}
        />
        {errors.notes && <p className="text-[0.625rem] text-destructive">{errors.notes}</p>}
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
          {pending ? "Saving…" : editing ? "Save changes" : "Add customer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
