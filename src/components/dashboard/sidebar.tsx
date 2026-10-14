"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  AnalyticsIcon,
  Home01Icon,
  LeftToRightListBulletIcon,
  ReceiptDollarIcon,
  SidebarLeft01Icon,
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

/**
 * Desktop sidebar (FR-3). Collapses to an icon rail via the footer toggle
 * (works.md F22): width and label visibility animate together with the
 * shell's content padding for one smooth, lag-free motion. Mobile keeps the
 * Sheet navigation in the header - this aside is lg+ only.
 */
export function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-background transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-19" : "w-60"
      )}
    >
      <Link
        href={OVERVIEW_HREF}
        aria-label={`${APP_NAME} — overview`}
        className={cn(
          "flex h-14 items-center gap-2.5 border-b transition-[padding] duration-300 ease-out hover:bg-muted/50",
          collapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <Logo className="size-6 shrink-0" />
        <span
          className={cn(
            "whitespace-nowrap text-sm font-semibold tracking-tight transition-opacity duration-200",
            collapsed && "hidden"
          )}
        >
          {APP_NAME}
        </span>
      </Link>

      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex items-center text-xs transition-colors",
                collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2",
                active
                  ? "bg-linear-to-r from-(--grad-from) to-(--grad-to) text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                strokeWidth={2}
                className={cn("size-3.5 shrink-0 transition-transform duration-300", collapsed && "size-4")}
              />
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200",
                  collapsed && "hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto flex items-center border-t p-3",
          collapsed ? "justify-center" : "justify-between px-4"
        )}
      >
        <p
          className={cn(
            "whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground/70 transition-opacity duration-200",
            collapsed && "hidden"
          )}
        >
          {APP_NAME} · v2.1
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-7 items-center justify-center border text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 active:translate-y-px"
        >
          <HugeiconsIcon
            icon={SidebarLeft01Icon}
            strokeWidth={2}
            className={cn("size-3.5 transition-transform duration-300 ease-out", collapsed && "rotate-180")}
          />
        </button>
      </div>
    </aside>
  );
}
