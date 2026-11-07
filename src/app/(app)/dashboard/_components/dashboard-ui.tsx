"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { CategoryOption } from "@/common/types";
import type { CategoryChoice } from "@/features/dashboard/mutations";
import { cn } from "@/lib/utils";

import { DashboardCardInfo } from "./dashboard-card-info";

/** True when the media query matches; false during server render. */
export function useMediaQuery(query: string) {
  // A stable subscribe keeps useSyncExternalStore from resubscribing on every render.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

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

type MenuPosition =
  | { mode: "sheet"; inDialog: boolean }
  | { mode: "popover"; inDialog: boolean; top: number; left: number; maxHeight: number };

/**
 * Category menu. On desktop it is a popover; on phones it is an action sheet. It renders inside the
 * nearest dialog (such as the day sheet) when there is one, so the dialog never hides or blocks it.
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
  const isPhone = useMediaQuery("(max-width: 639px)");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const place = useCallback(() => {
    if (!triggerElement) return;
    const dialog = triggerElement.closest<HTMLElement>('[role="dialog"]');
    setContainer(dialog ?? document.body);
    if (isPhone) {
      setPosition({ mode: "sheet", inDialog: Boolean(dialog) });
      return;
    }
    const rect = triggerElement.getBoundingClientRect();
    const frame = dialog?.getBoundingClientRect() ?? { top: 0, left: 0 };
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const below = window.innerHeight - rect.bottom - 14;
    const above = rect.top - 14;
    const maxHeight = Math.max(160, Math.min(360, Math.max(below, above)));
    const top = below >= Math.min(360, above) || below >= 240 ? rect.bottom + 6 : Math.max(8, rect.top - 6 - maxHeight);
    setPosition({ mode: "popover", inDialog: Boolean(dialog), top: top - frame.top, left: left - frame.left, maxHeight: below >= Math.min(360, above) || below >= 240 ? Math.min(360, below) : maxHeight });
  }, [triggerElement, isPhone]);

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
    const frame = requestAnimationFrame(() => {
      const menu = menuRef.current;
      (menu?.querySelector<HTMLButtonElement>("[role=menuitemradio][aria-checked=true]") ?? menu?.querySelector<HTMLButtonElement>("[role=menuitemradio]"))?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerElement?.contains(target)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? [])];
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
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
          "flex w-full items-center justify-between gap-2 rounded-md py-2 pr-3 text-left text-sm transition-colors focus-visible:bg-secondary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          position?.mode === "sheet" ? "min-h-12" : "min-h-9",
          nested ? "pl-6" : "pl-3",
          active ? "bg-primary/12 text-foreground" : "text-secondary-foreground hover:bg-secondary/55 hover:text-foreground"
        )}
      >
        <span className={nested ? "font-medium" : "font-semibold text-foreground"}>{text}</span>
        {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
      </button>
    );
  };

  const list = categories.length ? (
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
  );

  let menu: ReactNode = null;
  if (open && position && container) {
    menu =
      position.mode === "sheet" ? (
        <>
          {/* Inside a sheet, reach over its 2px border so the menu covers the sheet edge to edge. */}
          <div aria-hidden className={cn("z-[120] bg-foreground/25", position.inDialog ? "absolute -inset-[2px] rounded-t-[16px]" : "fixed inset-0")} />
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className={cn(
              "z-[121] flex max-h-[70vh] flex-col rounded-t-[14px] border-2 border-b-0 border-border bg-popover shadow-[0_-4px_0_var(--foreground)]",
              position.inDialog ? "absolute -inset-x-[2px] -bottom-[2px]" : "fixed inset-x-0 bottom-0"
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-border/15 px-4 pb-2 pt-3">
              <p className="pt-1 text-sm font-semibold leading-5 text-foreground">{label}</p>
              <button type="button" onClick={() => close(true)} className={cn("min-h-9 shrink-0 rounded-[6px] px-2 text-sm underline underline-offset-4", focusRing)}>
                <span className="font-semibold">Close</span>
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-contain p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{list}</div>
          </div>
        </>
      ) : (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ position: position.inDialog ? "absolute" : "fixed", top: position.top, left: position.left, width: MENU_WIDTH, maxHeight: position.maxHeight, zIndex: 120 }}
          className="overflow-y-auto rounded-[8px] border-2 border-border bg-popover p-2 shadow-[3px_4px_0_var(--foreground)]"
        >
          <p className="px-3 pb-1.5 pt-0.5 text-xs font-semibold leading-4 text-secondary-foreground">{label}</p>
          {list}
        </div>
      );
  }

  return (
    <>
      {trigger({ open, toggle, ref: setTriggerElement })}
      {menu && container ? createPortal(menu, container) : null}
    </>
  );
}
