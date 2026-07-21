import type { ClassificationSource } from "@/common/types";
import { cn } from "@/lib/utils";

export function getAssignmentSourceLabel(source: ClassificationSource | null) {
  switch (source) {
    case "MANUAL":
      return "Manual";
    case "SUGGESTION":
      return "Suggestion";
    case "RULE":
      return "Rule";
    default:
      return "No assignment";
  }
}

export function AssignmentSourceBadge({
  source,
  className,
}: {
  source: ClassificationSource | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-[999px] border-2 border-border px-2.5 text-xs font-semibold text-foreground",
        source === "RULE" && "bg-[var(--paper-mint)]",
        source === "SUGGESTION" && "bg-[var(--paper-lilac)]",
        source === "MANUAL" && "bg-card",
        source === null && "bg-secondary/55 text-secondary-foreground",
        className
      )}
    >
      {getAssignmentSourceLabel(source)}
    </span>
  );
}
