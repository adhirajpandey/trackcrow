"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const mobileSurfaceClassName =
  "w-full max-w-full min-w-0 overflow-hidden rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] shadow-[0_8px_24px_rgba(0,0,0,0.16)]";

export const mobileCardClassName =
  "w-full max-w-full min-w-0 overflow-hidden rounded-[8px] border border-border/45 bg-background/12";

export function MobilePageHeader({
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
    <section className={cn("space-y-3 border-b border-border pb-5 lg:hidden", className)}>
      <div className="min-w-0 space-y-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/85">
            {eyebrow}
          </p>
          <h1 className="mt-2 break-words text-[2.05rem] font-bold leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <div className="mt-3 max-w-full text-[15px] leading-6 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {meta ? (
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-secondary-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
    </section>
  );
}

export function MobileSearchBar({
  defaultValue,
  placeholder,
  onChange,
  className,
}: {
  defaultValue?: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 w-full max-w-full min-w-0 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-secondary-foreground/75" />
      <input
        defaultValue={defaultValue}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/70"
      />
    </label>
  );
}

export function MobileFilterChips({
  items,
  className,
}: {
  items: Array<{
    label: string;
    tone?: "default" | "accent";
  }>;
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            "inline-flex min-h-8 max-w-full items-center rounded-[999px] border px-3 text-sm font-medium",
            item.tone === "accent"
              ? "border-accent/30 bg-accent/12 text-accent"
              : "border-primary/20 bg-primary/10 text-primary"
          )}
        >
          <span className="overflow-wrap-anywhere break-words">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function MobileBottomSheet({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="lg:hidden">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-2">{children}</div>
        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  );
}

export function MobileActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/96 px-4 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
        className
      )}
    >
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export function MobileEmptyState({
  icon,
  title,
  helper,
  className,
}: {
  icon?: ReactNode;
  title: string;
  helper?: string;
  className?: string;
}) {
  return (
    <div className={cn(mobileSurfaceClassName, "p-4", className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-[8px] border border-border/60 bg-secondary/24 p-2 text-primary">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {helper ? <p className="mt-1 text-sm leading-5 text-secondary-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function MobileStatGrid({
  items,
  columns = 1,
  className,
}: {
  items: Array<{ label: string; value: string; tone?: "default" | "primary" }>;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn(mobileCardClassName, "px-4 py-3")}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/80">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-2 break-words text-2xl font-semibold leading-tight tabular-nums",
              item.tone === "primary" ? "text-primary" : "text-foreground"
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function MobileCardList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-3 lg:hidden", className)}>{children}</div>;
}

export function MobileSectionPreview({
  title,
  description,
  href,
  hrefLabel,
  children,
  className,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(mobileSurfaceClassName, "p-4 lg:hidden", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[1.02rem] font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-secondary-foreground">{description}</p>
          ) : null}
        </div>
        {href && hrefLabel ? (
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link href={href}>{hrefLabel}</Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function MobilePagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className,
}: {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 lg:hidden", className)}>
      <Button type="button" variant="secondary" size="sm" disabled={!hasPrev} onClick={onPrev}>
        Previous
      </Button>
      <span className="text-sm text-secondary-foreground">
        Page {page} of {totalPages}
      </span>
      <Button type="button" variant="secondary" size="sm" disabled={!hasNext} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

export function MobileKeyValueList({
  items,
  className,
}: {
  items: Array<{ label: string; value: ReactNode; stack?: boolean }>;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex gap-3",
            item.stack ? "flex-col" : "items-start justify-between"
          )}
        >
          <span className="text-sm text-secondary-foreground">{item.label}</span>
          <div className={cn("min-w-0", item.stack ? "" : "text-right")}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function MobileLongValue({
  value,
  className,
}: {
  value: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("overflow-wrap-anywhere break-words text-sm font-medium text-foreground", className)}>
      {value}
    </span>
  );
}

export function MobileSectionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 w-full items-center justify-between rounded-[8px] border border-border/50 bg-background/12 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-background/18"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-secondary-foreground" />
    </Link>
  );
}

export function MobileSheetCloseButton() {
  return (
    <DrawerClose asChild>
      <Button variant="secondary">Close</Button>
    </DrawerClose>
  );
}
