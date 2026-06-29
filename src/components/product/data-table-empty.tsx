import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableEmpty({
  title,
  helper,
  icon,
  className,
}: {
  title: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center",
        className
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/45 bg-background/12 text-secondary-foreground">
          {icon}
        </div>
      ) : null}
      <p className={cn("text-sm font-medium text-foreground", icon && "mt-4")}>{title}</p>
      {helper ? <p className="mt-2 max-w-md text-sm text-secondary-foreground">{helper}</p> : null}
    </div>
  );
}
