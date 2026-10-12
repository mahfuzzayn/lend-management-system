"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Logout01Icon, Menu01Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { APP_NAME } from "@/lib/config";
import { cn, getInitials } from "@/lib/utils";
import { NAV_ITEMS, isActivePath, navTitleFor } from "./sidebar";
import type { Admin } from "@/types";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const title = navTitleFor(pathname);

  // Session info for the account menu; a 401 here means the session died
  // mid-visit (expired) - back to the login page.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ admin: current }) => {
        if (!cancelled) setAdmin(current);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.logout();
      toast("Signed out - see you soon.");
      router.replace("/login");
    } catch (error) {
      toast.error("Sign out failed.", { description: errorMessage(error) });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile navigation */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2.5 text-sm font-normal">
              <Logo className="size-5" />
              {APP_NAME}
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard mobile">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 border px-2 py-1.5 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Account menu"
            >
              <Avatar className="size-5">
                <AvatarFallback className="bg-primary text-[0.5rem] font-semibold text-primary-foreground">
                  {admin ? getInitials(admin.name) : "··"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden font-medium sm:inline">{admin?.name ?? "Admin"}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                strokeWidth={2}
                className="size-3 text-muted-foreground"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">{admin?.name ?? "Admin"}</span>
              <span className="font-mono text-[0.625rem] font-normal text-muted-foreground">
                {admin?.email ?? ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive" disabled={loggingOut}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
              {loggingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
