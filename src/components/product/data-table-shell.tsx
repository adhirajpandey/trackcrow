import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] shadow-[0_8px_24px_rgba(0,0,0,0.16)]",
        className
      )}
    >
      {children}
    </section>
  );
}
