"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { CategoryOption } from "@/common/types";
import type { CategoryChoice } from "@/features/dashboard/mutations";
import { cn } from "@/lib/utils";

import { DashboardCardInfo } from "./dashboard-card-info";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Same segmented control as the shared range picker's quick ranges. */
export const segmentClassName = "flex h-11 rounded-[8px] border-2 border-border bg-card";
export function segmentItemClassName(active: boolean) {
  return cn(
    "h-10 rounded-[6px] px-4 text-sm transition-colors",
    focusRing,
    active ? "bg-primary text-primary-foreground" : "text-secondary-foreground hover:bg-secondary/45 hover:text-foreground"
  );
}

/** The transactions table's category pill, at the dashboard's compact size. */
export function CategoryPill({
  value,
  label,
  title,
  className,
}: {
  value: string | null;
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex min-h-8 max-w-full items-center rounded-[999px] border-2 border-border px-2.5 text-xs font-bold text-foreground",
        value ? "bg-primary/35" : "bg-[#fff1bd]",
        className
      )}
    >
      <span className="truncate">{label ?? value ?? "Uncategorized"}</span>
    </span>
  );
}

export function InfoTip({ label, children }: { label: string; children: string }) {
  return <DashboardCardInfo label={label} description={children} />;
}

export function PanelNote({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center px-5 py-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body ? <p className="mt-1.5 max-w-xs text-sm text-secondary-foreground">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const MENU_WIDTH = 240;

/**
 * Category menu, rendered in a portal so panels with overflow-hidden never clip it.
 * Lists each category and its subcategories, like the transaction editor.
 */
export function CategoryMenu({
  label,
  categories,
  current,
  onPick,
  trigger,
}: {
  label: string;
  categories: CategoryOption[];
  current: { categoryUuid: string | null; subcategoryUuid: string | null } | null;
  onPick: (choice: CategoryChoice) => void;
  trigger: (props: { open: boolean; toggle: () => void; ref: (element: HTMLButtonElement | null) => void }) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const place = useCallback(() => {
    if (!triggerElement) return;
    const rect = triggerElement.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const below = window.innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const maxHeight = Math.max(160, Math.min(360, Math.max(below, above)));
    setPosition(
      below >= Math.min(360, above) || below >= 240
        ? { top: rect.bottom + 6, left, maxHeight: Math.min(360, below) }
        : { top: Math.max(8, rect.top - 6 - maxHeight), left, maxHeight }
    );
  }, [triggerElement]);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerElement?.focus();
  }, [triggerElement]);

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setOpen(true);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>("[aria-checked=true], button")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerElement?.contains(target)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open, place, close, triggerElement]);

  const item = (choice: CategoryChoice, text: string, nested: boolean) => {
    const active = current?.categoryUuid === choice.categoryUuid && (current?.subcategoryUuid ?? null) === choice.subcategoryUuid;
    return (
      <button
        key={`${choice.categoryUuid}:${choice.subcategoryUuid ?? ""}`}
        type="button"
        role="menuitemradio"
        aria-checked={active}
        onClick={() => {
          onPick(choice);
          close(true);
        }}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-md py-2 pr-3 text-left text-sm transition-colors focus-visible:bg-secondary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9",
          nested ? "pl-6" : "pl-3",
          active ? "bg-primary/12 text-foreground" : "text-secondary-foreground hover:bg-secondary/55 hover:text-foreground"
        )}
      >
        <span className={nested ? "font-medium" : "font-semibold text-foreground"}>{text}</span>
        {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
      </button>
    );
  };

  return (
    <>
      {trigger({ open, toggle, ref: setTriggerElement })}
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH, maxHeight: position.maxHeight, zIndex: 80 }}
              className="overflow-y-auto rounded-[8px] border-2 border-border bg-popover p-2 shadow-[3px_4px_0_var(--foreground)]"
            >
              <p className="px-3 pb-1.5 pt-0.5 text-xs font-semibold leading-4 text-secondary-foreground">{label}</p>
              {categories.length ? (
                categories.map((category) => (
                  <div key={category.uuid} role="group" aria-label={category.name}>
                    {item({ categoryUuid: category.uuid, subcategoryUuid: null, label: category.name }, category.name, false)}
                    {category.subcategories.map((subcategory) =>
                      item({ categoryUuid: category.uuid, subcategoryUuid: subcategory.uuid, label: `${category.name} · ${subcategory.name}` }, subcategory.name, true)
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-secondary-foreground">No categories yet. Add them in Settings.</p>
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
