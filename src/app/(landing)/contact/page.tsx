import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location02Icon, Mail02Icon, Time04Icon } from "@hugeicons/core-free-icons";

import { ContactForm } from "@/components/landing/contact-form";
import { SectionHeading } from "@/components/landing/section-heading";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about Lendbook? Write to us - we reply within one working day.",
};

const CHANNELS = [
  {
    icon: Mail02Icon,
    label: "E-mail",
    value: "support@lendbook.morlabs.co",
  },
  {
    icon: Time04Icon,
    label: "Response time",
    value: "Within one working day",
  },
  {
    icon: Location02Icon,
    label: "Based in",
    value: "Sylhet, Bangladesh",
  },
];

export default function ContactPage() {
  return (
    <section>
      <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="flex flex-col gap-10">
          <SectionHeading
            kicker="Contact"
            title="Talk to a human."
            description="A question about the ledger, a feature you wish existed, or something that looks wrong - it all reaches the same inbox."
          />
          <ul className="flex flex-col gap-4">
            {CHANNELS.map((channel) => (
              <li key={channel.label} className="flex items-center gap-4 border p-4">
                <span className="flex size-10 shrink-0 items-center justify-center border bg-background">
                  <HugeiconsIcon icon={channel.icon} strokeWidth={1.75} className="size-4.5" />
                </span>
                <div>
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {channel.label}
                  </p>
                  <p className="text-sm font-medium">{channel.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <Card className="p-6 sm:p-8">
            <ContactForm />
          </Card>
        </Reveal>
      </Container>
    </section>
  );
}
