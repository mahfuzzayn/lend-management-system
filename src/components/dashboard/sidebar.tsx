"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AnalyticsIcon,
  Home01Icon,
  LeftToRightListBulletIcon,
  ReceiptDollarIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";

import { Logo } from "@/components/shared/logo";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  /** Sidebar label. */
  label: string;
  /** Header title for the route (defaults to `label`). */
  title?: string;
  icon: IconSvgElement;
}

/** Overview lives at /dashboard/overview so its link never prefix-matches
 *  the other dashboard routes (review fix F3 — one active link at a time). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/overview", label: "Overview", title: "Overview", icon: AnalyticsIcon },
  { href: "/dashboard/customers", label: "Customers", icon: UserAccountIcon },
  { href: "/dashboard/transactions", label: "Transactions", icon: LeftToRightListBulletIcon },
  { href: "/dashboard/dues", label: "Due Summaries", icon: ReceiptDollarIcon },
  { href: "/", label: "Home", icon: Home01Icon },
];

export function isActivePath(pathname: string, href: string) {
  // "/" (landing Home) must match exactly — a prefix match would light it up
  // on every dashboard page.
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Derives the header title for the current dashboard route. */
export function navTitleFor(pathname: string) {
  const match = NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
  return match?.title ?? match?.label ?? "Overview";
}

export const OVERVIEW_HREF = "/dashboard/overview";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background lg:flex">
      <Link
        href={OVERVIEW_HREF}
        aria-label={`${APP_NAME} — overview`}
        className="flex h-14 items-center gap-2.5 border-b px-4 transition-colors hover:bg-muted/50"
      >
        <Logo className="size-6" />
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                active
                  ? "bg-linear-to-r from-[oklch(0.53_0.095_174)] to-[oklch(0.44_0.082_180)] text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t p-4">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground/70">
          {APP_NAME} · v1 static
        </p>
      </div>
    </aside>
  );
}
