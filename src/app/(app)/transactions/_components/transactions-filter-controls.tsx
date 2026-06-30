"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

import type { CategoryOption } from "@/common/types";
import type { TransactionsControlState } from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { cn } from "@/lib/utils";

import {
  buildCategoryTriggerLabel,
  buildClearCategoriesHref,
  buildClearSubcategoriesHref,
  buildResetHref,
  buildSearchHref,
  buildSubcategoryTriggerLabel,
  buildToggleSubcategoryHref,
  buildToggleCategoryHref,
} from "./transactions-view-model";

type CategoryMenuOption = {
  value: string;
  label: string;
};

export function TransactionsFilterControls({
  filters,
  categories,
  categoryOptions,
  subcategoryOptions,
}: {
  filters: TransactionsControlState;
  categories: CategoryOption[];
  categoryOptions: CategoryMenuOption[];
  subcategoryOptions: CategoryMenuOption[];
}) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const categoryTriggerLabel = buildCategoryTriggerLabel(filters);
  const subcategoryTriggerLabel = buildSubcategoryTriggerLabel(filters);
  const subcategoryDisabled = subcategoryOptions.length === 0;

  useEffect(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (searchInputRef.current && searchInputRef.current.value !== filters.q) {
      searchInputRef.current.value = filters.q;
    }
  }, [filters.q]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_minmax(11rem,0.28fr)_minmax(11rem,0.28fr)_3rem]">
      <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5">
        <Search className="h-4 w-4 text-secondary-foreground/75" />
        <input
          ref={searchInputRef}
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

      <FilterMenu
        label="Filter categories"
        triggerLabel={categoryTriggerLabel}
        options={[
          {
            href: buildClearCategoriesHref(filters),
            label: "All categories",
            selected: filters.categories.length === 0,
          },
          {
            href: buildToggleCategoryHref(filters, "Uncategorized", categories),
            label: "Uncategorized",
            selected: filters.categories.includes("Uncategorized"),
          },
          ...categoryOptions.map((option) => ({
            href: buildToggleCategoryHref(filters, option.value, categories),
            label: option.label,
            selected: filters.categories.includes(option.value),
          })),
        ]}
      />

      <FilterMenu
        label="Filter subcategories"
        triggerLabel={subcategoryTriggerLabel}
        disabled={subcategoryDisabled}
        disabledLabel="Select category first"
        options={[
          {
            href: buildClearSubcategoriesHref(filters),
            label: "All subcategories",
            selected: filters.subcategories.length === 0,
          },
          ...subcategoryOptions.map((option) => ({
            href: buildToggleSubcategoryHref(filters, option.value),
            label: option.label,
            selected: filters.subcategories.includes(option.value),
          })),
        ]}
      />

      <div className="flex items-center lg:justify-end">
        <button
          type="button"
          aria-label="Reset filters"
          title="Reset filters"
          onClick={() => updateTransactionsUrl(buildResetHref(filters), "replace")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-border/50 bg-background/10 text-secondary-foreground transition-colors hover:border-border/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FilterMenu({
  label,
  triggerLabel,
  options,
  disabled = false,
  disabledLabel,
}: {
  label: string;
  triggerLabel: string;
  options: Array<{
    href: string;
    label: string;
    selected: boolean;
  }>;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

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
        minWidth: Math.max(rect.width, 220),
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
    <div ref={menuRef} className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "border-border/70 bg-background/20",
          disabled && "cursor-not-allowed text-secondary-foreground/55 hover:bg-background/16"
        )}
      >
        <span className="truncate">{disabled ? disabledLabel ?? triggerLabel : triggerLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && !disabled
        ? createPortal(
            <div
              ref={menuPanelRef}
              role="listbox"
              style={menuStyle}
              className="overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]"
            >
              <div className="border-b border-border/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/80">
                {label}
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {options.map((option) => (
                  <FilterOptionLink
                    key={`${option.label}-${option.href}`}
                    href={option.href}
                    label={option.label}
                    selected={option.selected}
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
  );
}

function FilterOptionLink({
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
