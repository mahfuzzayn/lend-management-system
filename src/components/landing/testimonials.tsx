import { HugeiconsIcon } from "@hugeicons/react";
import { LeftToRightBlockQuoteIcon } from "@hugeicons/core-free-icons";

import { Container } from "@/components/shared/container";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const TESTIMONIALS = [
  {
    quote:
      "I used to keep three notebooks and still argue about balances. Now the due is just there — correct, every time.",
    name: "Rahim Uddin",
    role: "Grocer, New Market",
  },
  {
    quote:
      "The PDF settled a dispute in one minute. Handed over the whole history, running balance and all. Nothing left to debate.",
    name: "Nusrat Jahan",
    role: "Tailor, Mirpur",
  },
  {
    quote:
      "Ten customers, forty loans, zero spreadsheets. I open it, see who owes what, and get on with my day.",
    name: "Abdul Mannan",
    role: "Furniture works, Old Dhaka",
  },
] as const;

/** Social proof section (review fix F7) — quote cards with editorial marks. */
export function Testimonials() {
  return (
    <section className="border-b">
      <Container className="py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            kicker="Kept, not promised"
            title="Ledgers people actually trust"
            description="The same three habits, in the hands of lenders who stopped guessing."
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <StaggerItem key={testimonial.name}>
              <Card className="h-full justify-between gap-6 transition-transform duration-300 hover:-translate-y-1">
                <HugeiconsIcon
                  icon={LeftToRightBlockQuoteIcon}
                  strokeWidth={1.75}
                  className="size-6 text-primary/60"
                />
                <p className="text-sm/relaxed text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t pt-4">
                  <span className="flex size-8 shrink-0 items-center justify-center bg-linear-to-br from-(--grad-from) to-(--grad-to) text-[0.625rem] font-semibold text-primary-foreground">
                    {getInitials(testimonial.name)}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{testimonial.name}</p>
                    <p className="font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
