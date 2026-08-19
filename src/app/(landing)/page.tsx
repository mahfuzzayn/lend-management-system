import type { Metadata } from "next";

import { CarouselSection } from "@/components/landing/carousel-section";
import { CtaBand } from "@/components/landing/cta-band";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Testimonials } from "@/components/landing/testimonials";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  openGraph: {
    title: `${APP_NAME} — Lend Management System`,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Features />
      <CarouselSection />
      <Testimonials />
      <CtaBand />
    </>
  );
}
