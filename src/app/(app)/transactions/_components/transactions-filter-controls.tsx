"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

import type { TransactionsControlState } from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { cn } from "@/lib/utils";

import { TransactionsTimeframePicker } from "./transactions-timeframe-picker";
import {
  buildCategoryTriggerLabel,
  buildClearCategoriesHref,
  buildResetHref,
  buildSearchHref,
  buildToggleCategoryHref,
} from "./transactions-view-model";

type CategoryMenuOption = {
  value: string;
  label: string;
};

export function TransactionsFilterControls({
  filters,
  categoryOptions,
}: {
  filters: TransactionsControlState;
  categoryOptions: CategoryMenuOption[];
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);
  const triggerLabel = buildCategoryTriggerLabel(filters);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = rect.width;
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - minWidth - 12));

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: rect.width,
        minWidth: Math.max(rect.width, 240),
        zIndex: 80,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current?.contains(target);
      const clickedInsideMenu = menuPanelRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_auto]">
      <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5">
        <Search className="h-4 w-4 text-secondary-foreground/75" />
        <input
          key={filters.q}
          defaultValue={filters.q}
          onChange={(event) => {
            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            const nextValue = event.target.value;
            searchTimeoutRef.current = window.setTimeout(() => {
              const nextHref = buildSearchHref(filters, nextValue);
              updateTransactionsUrl(nextHref, "replace");
            }, 300);
          }}
          placeholder="Search recipient, remarks, amount..."
          className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/70"
        />
      </label>

      <TransactionsTimeframePicker filters={filters} />

      <div ref={menuRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen && "border-border/70 bg-background/20"
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
          />
        </button>

        {isOpen
          ? createPortal(
              <div
                ref={menuPanelRef}
                role="listbox"
                style={menuStyle}
                className="overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]"
              >
                <div className="border-b border-border/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/80">
                  Filter categories
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <CategoryOptionLink
                    href={buildClearCategoriesHref(filters)}
                    label="All categories"
                    selected={filters.categories.length === 0}
                    onSelect={(href) => {
                      setIsOpen(false);
                      updateTransactionsUrl(href, "replace");
                    }}
                  />
                  <CategoryOptionLink
                    href={buildToggleCategoryHref(filters, "Uncategorized")}
                    label="Uncategorized"
                    selected={filters.categories.includes("Uncategorized")}
                    onSelect={(href) => {
                      setIsOpen(false);
                      updateTransactionsUrl(href, "replace");
                    }}
                  />
                  {categoryOptions.map((option) => (
                    <CategoryOptionLink
                      key={option.value}
                      href={buildToggleCategoryHref(filters, option.value)}
                      label={option.label}
                      selected={filters.categories.includes(option.value)}
                      onSelect={(href) => {
                        setIsOpen(false);
                        updateTransactionsUrl(href, "replace");
                      }}
                    />
                  ))}
                </div>
              </div>,
              document.body
            )
          : null}
      </div>

      <div className="flex items-center gap-2 xl:justify-end">
        <button
          type="button"
          onClick={() => updateTransactionsUrl(buildResetHref(), "replace")}
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-border/50 bg-background/10 px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:border-border/70 hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function CategoryOptionLink({
  href,
  label,
  selected,
  onSelect,
}: {
  href: string;
  label: string;
  selected: boolean;
  onSelect: (href: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(href)}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:bg-secondary/20"
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}
