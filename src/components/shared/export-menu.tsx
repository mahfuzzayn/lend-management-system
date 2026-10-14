"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/lib/export";

interface ExportMenuProps {
  /** Gather rows and call downloadExport; return the written filename. */
  onExport: (format: ExportFormat) => string | Promise<string>;
  disabled?: boolean;
}

/** CSV/JSON export trigger (FR-9b) - one dropdown, user's choice of format. */
export function ExportMenu({ onExport, disabled }: ExportMenuProps) {
  const [pending, setPending] = useState(false);

  async function run(format: ExportFormat) {
    setPending(true);
    try {
      const filename = await onExport(format);
      toast.success("Export downloaded", { description: filename });
    } catch (error) {
      toast.error("Couldn't build the export.", {
        description: error instanceof Error ? error.message : "Nothing was downloaded.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || pending} aria-label="Export data">
          <HugeiconsIcon icon={Download04Icon} strokeWidth={2} data-icon="inline-start" />
          {pending ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void run("csv")}>CSV (spreadsheet)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void run("json")}>JSON (data)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
