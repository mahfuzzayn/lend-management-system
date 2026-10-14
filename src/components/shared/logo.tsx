"use client";

import { useState } from "react";
import Image from "next/image";

import { PROJECT } from "@/lib/project";
import { cn } from "@/lib/utils";

/**
 * Brand mark — the owner's logo (lib/project.ts) when it loads, falling back
 * to the gradient initial block if the image is missing or fails (review fix F8).
 */
export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  /** Fallback block style for dark panels. */
  inverted?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center bg-linear-to-br from-(--grad-from) to-(--grad-to) text-[0.625rem] font-bold text-primary-foreground",
          inverted && "from-[oklch(0.985_0.005_272)] to-[oklch(0.92_0.02_272)] text-foreground",
          className
        )}
      >
        {PROJECT.brand.logo.fallbackText}
      </span>
    );
  }

  return (
    <Image
      src={PROJECT.brand.logo.src}
      alt={PROJECT.brand.logo.alt}
      width={96}
      height={96}
      priority
      onError={() => setFailed(true)}
      className={cn("size-6 shrink-0 object-contain", className)}
    />
  );
}
