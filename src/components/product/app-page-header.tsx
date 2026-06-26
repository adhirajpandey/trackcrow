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
        "border-b border-border pb-6",
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/85">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight text-foreground lg:text-[42px]">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 max-w-2xl text-[15px] leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
          {meta ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-secondary-foreground">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  );
}
