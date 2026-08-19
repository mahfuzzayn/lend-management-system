import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { APP_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="size-5" />
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME} - calm ledgers for private lenders.
          </span>
        </div>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/about" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/contact" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Contact
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
