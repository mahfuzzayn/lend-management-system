"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounced } from "@/hooks/use-debounced";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CustomerWithDue } from "@/types";

interface CustomerPickerProps {
  id?: string;
  /** Selected customer id ("" = none). */
  value: string;
  /** Label shown on the closed trigger for the current value. */
  selectedLabel?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  /** Filters offer an "All customers" first option. */
  includeAll?: boolean;
}

/** Trigger text for a picked row - codes make every Goura unambiguous. */
function optionLabel(c: CustomerWithDue): string {
  if (!c.id) return "All customers";
  return c.customerCode ? `${c.customerCode} · ${c.name}` : c.name;
}

/**
 * Searchable single-customer picker (FR-7.2/7.4): a debounced server search
 * over code / name / business / phone, so it works across the whole book
 * (not just the first page a Select could hold).
 *
 * Selection works three ways (works.md F13): mouse/touch click on a row,
 * Enter on the highlighted row, or arrows + Enter from the search box.
 *
 * Two render modes share one list (works.md #2): on the page, a portaled
 * popover; inside a dialog, an in-place panel. The dialog's scroll lock
 * (react-remove-scroll) cancels wheel events over portaled content, so a
 * portaled list can't be wheel-scrolled there - rendered in-place it is a
 * DOM descendant of the dialog content and scrolls freely (F15/F20 pattern).
 */
export function CustomerPicker({
  id,
  value,
  selectedLabel,
  onChange,
  placeholder = "Search or pick a customer…",
  className,
  includeAll = false,
  ...aria
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  // In-dialog mode: render the options in-place instead of a portal.
  const [inline, setInline] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const [options, setOptions] = useState<CustomerWithDue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // The row the user last picked, so the trigger names it (works.md #2).
  const [pickedRow, setPickedRow] = useState<CustomerWithDue | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape in inline mode must close the picker WITHOUT closing the
  // surrounding dialog. Radix's dialog listens for Escape with capture on
  // document - before React can dispatch any capture handler - so the only
  // earlier vantage point is a window-level capture listener, which also
  // stops the event from ever reaching the dialog's listener.
  useEffect(() => {
    if (!open || !inline) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!panelRef.current?.contains(event.target as Node | null)) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [open, inline]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .listCustomers({ search: debouncedQuery.trim() || undefined, limit: 50 })
      .then((result) => {
        if (!cancelled) setOptions(result.items);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  /** Flat pickable rows: the optional "All customers" pseudo-row comes first. */
  const rows = useMemo(
    () => (includeAll ? [{ id: "", name: "All customers" } as CustomerWithDue, ...(options ?? [])] : options ?? []),
    [includeAll, options]
  );
  // Clamp instead of resetting on data change - no state churn, always valid.
  const active = Math.min(activeIndex, Math.max(0, rows.length - 1));

  function openPicker(next: boolean) {
    setOpen(next);
    if (next) {
      setInline(Boolean(triggerRef.current?.closest('[data-slot="dialog-content"]')));
      setQuery("");
      setActiveIndex(0);
      setLoading(true);
    }
  }

  function pick(row: CustomerWithDue) {
    onChange(row.id);
    setPickedRow(row);
    setOpen(false);
    setQuery("");
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); // keep the caret in the search box
      if (rows.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = (active + delta + rows.length) % rows.length;
      setActiveIndex(next);
      listRef.current
        ?.querySelector(`[data-option-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Home" && rows.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && rows.length > 0) {
      event.preventDefault();
      setActiveIndex(rows.length - 1);
    } else if (event.key === "Enter") {
      // Enter picks the highlighted row - never submits the surrounding form.
      event.preventDefault();
      const row = rows[active];
      if (row) pick(row);
    }
  }

  const triggerLabel =
    selectedLabel ??
    (value
      ? pickedRow && pickedRow.id === value
        ? optionLabel(pickedRow)
        : "Selected customer"
      : placeholder);

  const trigger = (
    <Button
      type="button"
      ref={triggerRef}
      id={id}
      variant="outline"
      aria-invalid={aria["aria-invalid"]}
      aria-haspopup="listbox"
      aria-expanded={open}
      // The popover trigger toggles by itself; in inline mode this button is
      // on its own, so it toggles here (inline flips on the first open).
      onClick={() => {
        if (inline) openPicker(!open);
      }}
      className={cn("w-full justify-between font-normal", className)}
    >
      <span className={cn("truncate text-xs", !value && !selectedLabel && "text-muted-foreground")}>
        {triggerLabel}
      </span>
      <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} className="size-3.5 shrink-0 text-muted-foreground" />
    </Button>
  );

  const searchInput = (
    <div className="relative border-b p-2">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      {/* autoFocus mounts focus here naturally - no focus tricks that a
          surrounding modal Dialog would fight (works.md F13). */}
      <Input
        ref={inputRef}
        value={query}
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value);
          setLoading(true);
        }}
        onKeyDown={handleInputKeyDown}
        placeholder="Code, name, phone…"
        className="border-none pl-7 shadow-none focus-visible:ring-0"
        aria-label="Search customers"
        role="combobox"
        aria-expanded
        aria-controls="customer-picker-options"
        aria-activedescendant={rows[active] ? `customer-option-${rows[active].id || "all"}` : undefined}
      />
    </div>
  );

  const optionsList = (
    // The one true scroll container: capped height, own scroll axis,
    // contained overscroll so wheel/touch never chains to the page.
    <div
      ref={listRef}
      id="customer-picker-options"
      role="listbox"
      aria-label="Customers"
      className="max-h-64 overflow-y-auto overscroll-contain p-1"
    >
      {loading && options === null ? (
        <div className="flex flex-col gap-2 p-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <>
          {rows.map((c, index) => {
            const isAll = c.id === "";
            return (
              <button
                type="button"
                key={c.id || "all"}
                role="option"
                aria-selected={value === c.id}
                data-option-index={index}
                id={`customer-option-${c.id || "all"}`}
                // Don't steal focus on press - the search box keeps it, so
                // Enter/arrow flow continues after a tap.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c)}
                className={cn(
                  "flex w-full flex-col gap-0.5 px-2 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  value === c.id && "bg-accent",
                  index === active && "bg-accent"
                )}
              >
                {isAll ? (
                  <span className="text-xs font-medium">All customers</span>
                ) : (
                  <>
                    <span className="flex items-baseline gap-2">
                      {c.customerCode && (
                        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                          {c.customerCode}
                        </span>
                      )}
                      <span className="truncate text-xs font-medium">{c.name}</span>
                    </span>
                    {(c.phone || c.businessName) && (
                      <span className="truncate font-mono text-[0.625rem] text-muted-foreground">
                        {[c.businessName, c.phone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
          {!loading && rows.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              No customer matches.
            </p>
          )}
          {loading && rows.length > 0 && (
            <p className="px-3 py-1.5 text-center font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
              searching…
            </p>
          )}
        </>
      )}
    </div>
  );

  // In-dialog: no portal. Closing on focus leaving the panel (rows keep the
  // search box focused via onMouseDown preventDefault, so a row click never
  // blurs); Escape is intercepted in capture and default-prevented so the
  // surrounding dialog's radix layer sees it as handled and stays open.
  if (inline) {
    return (
      <div
        className="relative"
        onBlur={(e) => {
          if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        {trigger}
        {open && (
          <div
            ref={panelRef}
            className="absolute top-full right-0 left-0 z-30 mt-1 rounded-lg bg-popover text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {searchInput}
            {optionsList}
          </div>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={openPicker}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {searchInput}
        {optionsList}
      </PopoverContent>
    </Popover>
  );
}
