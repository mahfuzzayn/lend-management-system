"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { businessTypeLabel, recoveryStatusLabel, riskLabel } from "@/lib/utils";
import { customerSchema, fieldErrors } from "@/schemas";
import type { BusinessType, Customer, RecoveryStatus, RiskLevel } from "@/types";

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {customer
              ? "Update the record - ledger history stays untouched."
              : "A name is all a ledger needs to start - fill the rest as you learn it."}
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
  alternativePhone: string;
  businessName: string;
  area: string;
  businessType: string;
  riskLevel: string;
  recoveryStatus: string;
  email: string;
  address: string;
  customerSince: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  alternativePhone: "",
  businessName: "",
  area: "",
  businessType: "",
  riskLevel: "",
  recoveryStatus: "",
  email: "",
  address: "",
  customerSince: "",
  notes: "",
};

const BUSINESS_TYPES: BusinessType[] = ["workshop", "contractor", "retail-shop", "company", "individual"];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];
const RECOVERY_STATUSES: RecoveryStatus[] = [
  "not-contacted",
  "contacted",
  "promise-made",
  "partial-payment",
  "completed",
  "refused",
  "disputed",
  "legal-action",
];

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
            phone: customer.phone ?? "",
            alternativePhone: customer.alternativePhone ?? "",
            businessName: customer.businessName ?? "",
            area: customer.area ?? "",
            businessType: customer.businessType ?? "",
            riskLevel: customer.riskLevel ?? "",
            recoveryStatus: customer.recoveryStatus ?? "",
            email: customer.email ?? "",
            address: customer.address ?? "",
            customerSince: customer.customerSince ? customer.customerSince.slice(0, 10) : "",
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
        toast.success("Customer added", {
          description: created.customerCode ? `${created.customerCode} · ${created.name}` : created.name,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setErrors(
          error.message.toLowerCase().includes("code")
            ? { customerCode: error.message }
            : { phone: error.message }
        );
      } else {
        toast.error("Nothing was saved.", { description: errorMessage(error) });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
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

        {editing && customer?.customerCode ? (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="customer-code-display">Customer code</Label>
            <Input
              id="customer-code-display"
              value={customer.customerCode}
              readOnly
              className="bg-muted/40 font-mono"
            />
            <p className="text-[0.625rem] text-muted-foreground">
              Assigned when the customer was created - it never changes.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-phone">
            Phone <span className="text-muted-foreground">(optional)</span>
          </Label>
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
          <Label htmlFor="customer-alt-phone">
            Alternative phone <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="customer-alt-phone"
            value={values.alternativePhone}
            onChange={(e) => set("alternativePhone", e.target.value)}
            placeholder="+880 1811-223344"
            aria-invalid={Boolean(errors.alternativePhone)}
          />
          {errors.alternativePhone && (
            <p className="text-[0.625rem] text-destructive">{errors.alternativePhone}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="customer-business">
            Business name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="customer-business"
            value={values.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            placeholder="Al Modina Engineering Workshop"
            aria-invalid={Boolean(errors.businessName)}
          />
          {errors.businessName && (
            <p className="text-[0.625rem] text-destructive">{errors.businessName}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-area">
            Area <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="customer-area"
            value={values.area}
            onChange={(e) => set("area", e.target.value)}
            placeholder="Bypass, Sylhet"
            aria-invalid={Boolean(errors.area)}
          />
          {errors.area && <p className="text-[0.625rem] text-destructive">{errors.area}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-business-type">
            Business type <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select value={values.businessType} onValueChange={(v) => set("businessType", v)}>
            <SelectTrigger id="customer-business-type" className="w-full">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {businessTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-risk">
            Risk level <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select value={values.riskLevel} onValueChange={(v) => set("riskLevel", v)}>
            <SelectTrigger id="customer-risk" className="w-full">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map((r) => (
                <SelectItem key={r} value={r}>
                  {riskLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-recovery">
            Recovery status <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select value={values.recoveryStatus} onValueChange={(v) => set("recoveryStatus", v)}>
            <SelectTrigger id="customer-recovery" className="w-full">
              <SelectValue placeholder="Pick one" />
            </SelectTrigger>
            <SelectContent>
              {RECOVERY_STATUSES.map((r) => (
                <SelectItem key={r} value={r}>
                  {recoveryStatusLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <DatePickerField
          id="customer-since"
          label={
            <>
              Customer since <span className="text-muted-foreground">(optional)</span>
            </>
          }
          value={values.customerSince}
          onChange={(v) => set("customerSince", v)}
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="customer-address">
            Address <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="customer-address"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Chondipul, Dakshin Surma, Sylhet"
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address && (
            <p className="text-[0.625rem] text-destructive">{errors.address}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
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
