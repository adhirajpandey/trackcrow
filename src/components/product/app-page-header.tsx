import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden border-b-2 border-border/25 pb-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-full">
          <p className="font-hand text-[17px] font-normal leading-tight text-destructive">
            {eyebrow}
          </p>
          <h1 className="mt-1 break-words text-[38px] font-extrabold leading-none tracking-[-0.04em] text-foreground lg:text-[52px]">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 max-w-2xl min-w-0 text-[15px] leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
          {meta ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-secondary-foreground">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? <div className="w-full shrink-0 lg:w-auto">{actions}</div> : null}
      </div>
    </section>
  );
}
