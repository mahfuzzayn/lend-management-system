import type { Metadata } from "next";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Coins01Icon,
  Download04Icon,
  LockKeyIcon,
  Shield01Icon,
  Store01Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { Container } from "@/components/shared/container";
import { Reveal, Stagger, StaggerItem } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${APP_NAME} exists - a private, minimal ledger for people who lend money and want their dues computed, not guessed.`,
};

const AUDIENCE: { icon: IconSvgElement; title: string; body: string }[] = [
  {
    icon: Store01Icon,
    title: "Shopkeepers with regulars",
    body: "You front stock to familiar faces and trust memory to keep it straight. Memory drifts; a ledger doesn't.",
  },
  {
    icon: UserAccountIcon,
    title: "Private lenders",
    body: "A handful of people, honest amounts, no interest engines - just a truthful record of who owes what.",
  },
  {
    icon: Coins01Icon,
    title: "Small offices",
    body: "Staff advances and informal loans tracked beside the payroll, without bending a spreadsheet into one.",
  },
];

const PRINCIPLES: { icon: IconSvgElement; num: string; title: string; body: string }[] = [
  {
    icon: LockKeyIcon,
    num: "01",
    title: "Private by default",
    body: "One administrator, one login. There is no public data, no sharing, and no third pair of eyes on your ledger.",
  },
  {
    icon: Shield01Icon,
    num: "02",
    title: "Derived, never entered",
    body: "You record movements - lends and repayments. Dues are computed from the ledger every time, so they can never disagree with it.",
  },
  {
    icon: Download04Icon,
    num: "03",
    title: "History in one file",
    body: "Any customer's complete story - profile, every entry, running balance - exports as a single PDF when you need paper.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b">
        <Container className="py-16 sm:py-24">
          <Reveal className="max-w-2xl">
            <SectionHeading
              kicker={`About ${APP_NAME}`}
              title="Built for one careful lender."
              description={`Most lending software is built for institutions - branches, officers, interest schedules. ${APP_NAME} is built for the opposite: one person, lending their own money, who simply wants the arithmetic to be right.`}
            />
          </Reveal>
        </Container>
      </section>

      <section className="border-b">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHeading kicker="Who it's for" title="Three kinds of lender, one ledger." />
          </Reveal>
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {AUDIENCE.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="h-full transition-transform duration-300 hover:-translate-y-1">
                  <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                    <HugeiconsIcon icon={item.icon} strokeWidth={1.75} className="size-4.5" />
                  </span>
                  <p className="text-sm font-semibold tracking-tight">{item.title}</p>
                  <p className="text-xs/relaxed text-muted-foreground">{item.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      <section>
        <Container className="py-16 sm:py-24">
          <Reveal>
            <SectionHeading
              kicker="Principles"
              title="Three promises the ledger keeps."
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <StaggerItem key={item.num}>
                <Card className="h-full transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg border bg-background">
                      <HugeiconsIcon icon={item.icon} strokeWidth={1.75} className="size-4.5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground/60">{item.num}</span>
                  </div>
                  <p className="text-sm font-semibold tracking-tight">{item.title}</p>
                  <p className="text-xs/relaxed text-muted-foreground">{item.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>
    </>
  );
}
