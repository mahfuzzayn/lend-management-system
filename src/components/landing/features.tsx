import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Chart02Icon,
  Money02Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { Container } from "@/components/shared/container";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "./section-heading";

const FEATURES: { icon: IconSvgElement; num: string; title: string; body: string }[] = [
  {
    icon: UserAccountIcon,
    num: "01",
    title: "Customers, not contacts",
    body: "A name and a phone number is all it takes. Lendbook keeps each person's full lending history, notes, and current standing - searchable in a few keystrokes.",
  },
  {
    icon: Money02Icon,
    num: "02",
    title: "A ledger that adds itself",
    body: "Money out is a lend, money in is a repayment. Every entry is dated, method-tagged, and folded into a running balance the moment you save it.",
  },
  {
    icon: Chart02Icon,
    num: "03",
    title: "Dues without the arithmetic",
    body: "Outstanding, settled, or advance - each customer's due is derived from the ledger, never typed in by hand, so it can never drift from reality.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add a customer",
    body: "A name and phone number. Jot a note about why they borrow - you'll thank yourself later.",
  },
  {
    n: "02",
    title: "Record the movement",
    body: "Gave ৳12,000? It's a lend. Got ৳5,000 back? A repayment. Pick cash, bank, or mobile banking and move on.",
  },
  {
    n: "03",
    title: "Let dues settle themselves",
    body: "Balances, summaries, and a full history per customer - exportable as a single PDF whenever you need the paper trail.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b">
      <Container className="py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            kicker="The essentials"
            title="A ledger with three moving parts"
            description="No interest engines, no EMI schedules, no noise - just the parts a private lender actually uses, done carefully."
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.num}>
              <Card className="h-full transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center border bg-background">
                    <HugeiconsIcon icon={feature.icon} strokeWidth={1.75} className="size-4.5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/60">{feature.num}</span>
                </div>
                <p className="text-sm font-semibold tracking-tight">{feature.title}</p>
                <p className="text-xs/relaxed text-muted-foreground">{feature.body}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div id="how" className="mt-24 scroll-mt-20">
          <Reveal>
            <SectionHeading
              kicker="How it works"
              title="Three habits. That's the whole system."
            />
          </Reveal>
          <Stagger className="mt-10 border-t">
            {STEPS.map((step) => (
              <StaggerItem
                key={step.n}
                className="grid grid-cols-[3rem_1fr] gap-4 border-b py-6 md:grid-cols-[5rem_14rem_1fr] md:gap-8 md:py-8"
              >
                <span className="font-mono text-lg text-muted-foreground/50 md:text-xl">
                  {step.n}
                </span>
                <p className="text-sm font-semibold tracking-tight md:text-base">{step.title}</p>
                <p className="col-span-2 text-xs/relaxed text-muted-foreground md:col-span-1 md:text-sm/relaxed">
                  {step.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
