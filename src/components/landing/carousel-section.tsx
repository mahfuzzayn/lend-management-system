"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "./section-heading";

const SLIDES = [
  {
    day: "Monday",
    headline: "Karim takes ৳12,000 to restock his shop before Eid.",
    chip: "Lend · cash",
    meta: "due → ৳12,000",
  },
  {
    day: "Thursday",
    headline: "He sends back ৳5,000 after the weekend rush.",
    chip: "Repayment · mobile banking",
    meta: "due → ৳7,000",
  },
  {
    day: "Sunday",
    headline: "Nusrat clears what she owed — down to the last taka.",
    chip: "Settled",
    meta: "due → ৳0",
  },
  {
    day: "Month end",
    headline: "One tap, one PDF — every customer's whole history on paper.",
    chip: "Export",
    meta: "history.pdf",
  },
];

/**
 * "In practice" narrative carousel (review fix F2): the embla viewport is
 * overflow-hidden, so cards get vertical breathing room inside it (their
 * ring borders stay visible) and the arrows live in a control row below
 * instead of hanging outside the clipped area.
 */
export function CarouselSection() {
  return (
    <section className="border-b bg-linear-to-b from-accent via-background to-background">
      <Container className="py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            kicker="In practice"
            title="A working week, ledgered"
            description="Real movements, recorded as they happen — watch the dues follow along on their own."
          />
        </Reveal>

        <Reveal className="mt-12">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-5 pt-1 pb-1">
              {SLIDES.map((slide) => (
                <CarouselItem key={slide.day} className="pl-5 basis-full md:basis-1/2">
                  <Card className="h-full justify-between gap-10 p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-muted-foreground">
                        {slide.day}
                      </span>
                      <span className="size-1.5 bg-primary/40" aria-hidden />
                    </div>
                    <p className="max-w-md text-balance text-xl font-medium tracking-tight sm:text-2xl">
                      {slide.headline}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {slide.chip}
                      </Badge>
                      <span className="font-mono text-[0.625rem] text-muted-foreground">
                        {slide.meta}
                      </span>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Controls inside the Carousel context and the section bounds —
                no negative offsets, no clipped borders */}
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
                drag, or use the arrows
              </p>
              <div className="flex gap-2">
                <CarouselPrevious className="static" />
                <CarouselNext className="static" />
              </div>
            </div>
          </Carousel>
        </Reveal>
      </Container>
    </section>
  );
}
