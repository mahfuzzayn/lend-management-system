"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Brand mark — /public/images/logo.png when it loads, falling back to the
 * classic gradient "L" block if the image is missing or fails (review fix F8).
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
          "flex size-6 shrink-0 items-center justify-center bg-linear-to-br from-[oklch(0.585_0.095_172)] to-[oklch(0.415_0.078_182)] text-[0.625rem] font-bold text-primary-foreground",
          inverted && "from-[oklch(0.985_0.005_180)] to-[oklch(0.92_0.02_178)] text-foreground",
          className
        )}
      >
        L
      </span>
    );
  }

  return (
    <Image
      src="/images/logo.png"
      alt="Lendbook logo"
      width={96}
      height={96}
      priority
      onError={() => setFailed(true)}
      className={cn("size-6 shrink-0 object-contain", className)}
    />
  );
}
