import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableShell({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[4px_5px_0_var(--foreground)]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
