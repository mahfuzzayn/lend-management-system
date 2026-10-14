"use client";

import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { useSignedIn } from "@/hooks/use-signed-in";

export function CtaBand() {
  const signedIn = useSignedIn();

  return (
    <section className="bg-linear-to-br from-(--grad-from) via-(--grad-via) to-(--grad-to) text-primary-foreground">
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
            <Link href={signedIn ? "/dashboard/overview" : "/login"}>
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
