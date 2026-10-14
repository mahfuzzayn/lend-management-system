import { APP_NAME } from "@/lib/config";

const ITEMS = [
  "Customers",
  "Lends",
  "Repayments",
  "Running balances",
  "Due summaries",
  "One-tap PDF history",
  "Single admin",
  "৳ BDT ledger",
] as const;

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-8">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-primary-foreground">
            {item}
          </span>
          <span className="size-1 bg-primary-foreground/50" aria-hidden />
        </span>
      ))}
    </div>
  );
}

/**
 * Scrolling capabilities band right after the hero (review fix F6).
 * Pure CSS animation — duplicated row for a seamless loop, paused for
 * prefers-reduced-motion (see globals.css).
 */
export function Marquee() {
  return (
    <section
      aria-label={`What ${APP_NAME} tracks`}
      className="overflow-hidden border-y bg-linear-to-r from-(--grad-from) via-(--grad-via) to-(--grad-to) py-3"
    >
      <div className="animate-marquee flex w-max">
        <Row />
        <Row ariaHidden />
      </div>
    </section>
  );
}
