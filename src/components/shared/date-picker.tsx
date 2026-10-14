"use client";

import * as React from "react";
import { CalendarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";

/** Local-calendar today (YYYY-MM-DD) - en-CA yields ISO order. */
function localToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

/** "2026-08-17" -> local Date (no UTC midnight shift). */
function parseLocalDate(value: string): Date | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Date -> "27/03/2005" for the manual input (works.md F13's format). */
function toDmy(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

/**
 * Parse a typed date: "27/03/2005" (preferred) or "2005-03-27". Single-digit
 * day/month are fine; the calendar must round-trip (no 31 Feb). Returns
 * YYYY-MM-DD, the value/onChange currency of this component.
 */
function parseTypedDate(text: string): string | undefined {
  const trimmed = text.trim();
  const dmy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  const iso = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  let day: number, month: number, year: number;
  if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date.toLocaleDateString("en-CA");
}

interface DatePickerProps {
  id?: string;
  /** Controlled value as YYYY-MM-DD ("" = none picked yet). */
  value: string;
  onChange: (value: string) => void;
  /** Latest selectable day as YYYY-MM-DD (e.g. today - never future). */
  max?: string;
  placeholder?: string;
  className?: string;
  /** Accessible name for the trigger button (filters pass "From date" etc.). */
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

/**
 * Date field backed by the shadcn Calendar in a popover. Works as a plain
 * controlled input: value/onChange are YYYY-MM-DD strings, exactly what the
 * shared zod schemas and the API expect.
 *
 * The popover offers month + year dropdowns (no endless month-paging) and a
 * manual text field that accepts DD/MM/YYYY directly (works.md F13).
 */
export function DatePicker({
  id,
  value,
  onChange,
  max,
  placeholder = "Pick a date",
  className,
  disabled = false,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date | undefined>(undefined);
  // The manual input's draft text (null = mirror the committed value).
  const [draft, setDraft] = React.useState<string | null>(null);
  const [invalid, setInvalid] = React.useState(false);

  const selected = value ? parseLocalDate(value) : undefined;
  const maxDate = max ? parseLocalDate(max) : undefined;
  // Dropdown bounds: a ledger never needs pre-1990, and nothing past the max.
  const startMonth = new Date(1990, 0, 1);
  const endMonth = maxDate ?? new Date(new Date().getFullYear(), 11, 31);

  // Adjust-without-effect: a new committed value resets the draft + view.
  const [prevValue, setPrevValue] = React.useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(null);
    setViewMonth(undefined);
    setInvalid(false);
  }

  const displayText = draft !== null ? draft : selected ? toDmy(selected) : "";

  /** Try to commit typed text; true when it became the new value. */
  function commitTyped(): boolean {
    if (draft === null) return true; // nothing typed since the last commit
    const parsed = parseTypedDate(draft);
    if (!parsed || (max && parsed > max)) {
      setInvalid(true);
      return false;
    }
    setInvalid(false);
    onChange(parsed);
    return true;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            aria-label={aria["aria-label"]}
            aria-invalid={aria["aria-invalid"]}
            className="w-full justify-between font-normal"
          >
            <span className={cn("text-xs", !value && "text-muted-foreground")}>
              {value ? formatDate(`${value}T00:00:00`) : placeholder}
            </span>
            <HugeiconsIcon icon={CalendarIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Manual entry: type 27/03/2005 (or 2005-03-27) and press Enter. */}
          <div className="border-b p-2">
            <Input
              value={displayText}
              onChange={(e) => {
                setDraft(e.target.value);
                setInvalid(false);
              }}
              onBlur={() => {
                // Snap back to the committed value when the text goes nowhere.
                if (!commitTyped()) setDraft(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (commitTyped()) setOpen(false);
                }
              }}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              aria-label="Type a date (day/month/year)"
              aria-invalid={invalid}
              className={cn(
                "h-7 border-none px-2 font-mono text-xs shadow-none focus-visible:ring-0",
                invalid && "text-destructive"
              )}
            />
          </div>
          <Calendar
            mode="single"
            selected={selected}
            month={viewMonth ?? selected}
            onMonthChange={setViewMonth}
            onSelect={(date) => {
              if (!date) return;
              // en-CA gives YYYY-MM-DD against the LOCAL calendar day.
              onChange(date.toLocaleDateString("en-CA"));
              setOpen(false);
            }}
            disabled={maxDate ? { after: maxDate } : undefined}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            autoFocus
          />
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <p className="pl-1 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
              or type it above
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                onChange(localToday());
                setOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Label + DatePicker pair, so forms stay one-liners. */
export function DatePickerField(props: DatePickerProps & { label: React.ReactNode }) {
  const { label, ...picker } = props;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={picker.id}>{label}</Label>
      <DatePicker {...picker} />
    </div>
  );
}
