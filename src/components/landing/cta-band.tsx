import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="bg-linear-to-br from-[oklch(0.53_0.095_174)] via-[oklch(0.45_0.084_179)] to-[oklch(0.37_0.07_186)] text-primary-foreground">
      <Container className="flex flex-col items-start gap-8 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
        <Reveal>
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop reconciling notebooks.
            <br />
            Start lending clearly.
          </h2>
          <p className="mt-3 max-w-md text-xs/relaxed text-primary-foreground/70">
            One admin, one ledger, every taka accounted for.
          </p>
        </Reveal>
        <Reveal>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
