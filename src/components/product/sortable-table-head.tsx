import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function SortableTableHead({
  label,
  direction,
  onClick,
  align = "left",
  className,
}: {
  label: string;
  direction: "asc" | "desc" | null;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  const ariaSort =
    direction === "asc"
      ? "ascending"
      : direction === "desc"
        ? "descending"
        : "none";

  return (
    <TableHead
      aria-sort={ariaSort}
      className={cn(align === "right" && "text-right", className)}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex w-full items-center gap-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" && "justify-end text-right"
        )}
      >
        <span>{label}</span>
        {direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : null}
        {direction === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : null}
        {direction === null ? (
          <ArrowUpDown className="h-3.5 w-3.5 text-secondary-foreground/55" />
        ) : null}
      </button>
    </TableHead>
  );
}
