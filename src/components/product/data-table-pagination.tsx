import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationItem = number | "ellipsis";

export function DataTablePagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  items,
  buildPageHref,
  onNavigate,
}: {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  items: PaginationItem[];
  buildPageHref: (page: number) => string;
  onNavigate: (href: string) => void;
}) {
  return (
    <nav className="flex items-center gap-2 self-end" aria-label="Pagination">
      <PageControl
        href={buildPageHref(Math.max(1, page - 1))}
        disabled={!hasPrev}
        ariaLabel="Previous page"
        onNavigate={onNavigate}
      >
        <ChevronLeft className="h-4 w-4" />
      </PageControl>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-secondary-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate(buildPageHref(item))}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border px-3 text-sm font-medium transition-colors",
              item === page
                ? "border-primary/35 bg-primary/14 text-primary"
                : "border-border/45 bg-background/10 text-foreground hover:border-border/70 hover:bg-background/16"
            )}
          >
            {item}
          </button>
        )
      )}

      <PageControl
        href={buildPageHref(Math.min(totalPages, page + 1))}
        disabled={!hasNext}
        ariaLabel="Next page"
        onNavigate={onNavigate}
      >
        <ChevronRight className="h-4 w-4" />
      </PageControl>
    </nav>
  );
}

function PageControl({
  href,
  disabled,
  ariaLabel,
  onNavigate,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  onNavigate: (href: string) => void;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-border/30 bg-background/8 text-secondary-foreground/65"
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(href)}
      aria-label={ariaLabel}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-border/45 bg-background/10 text-foreground transition-colors hover:border-border/70 hover:bg-background/16"
    >
      {children}
    </button>
  );
}
