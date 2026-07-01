"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

import {
  quickDashboardRanges,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";
import type { CategoryOption } from "@/common/types";
import {
  MobileTimePeriodRow,
  mobileDashboardSecondaryRanges,
} from "@/components/product/mobile/mobile-time-period-row";
import { getDashboardRangeState } from "@/features/dashboard/query-state";
import type { TransactionsControlState } from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { cn } from "@/lib/utils";

import {
  buildCategoryTriggerLabel,
  buildClearCategoriesHref,
  buildClearSubcategoriesHref,
  buildResetFilterState,
  buildResetHref,
  buildSearchHref,
  buildSubcategoryTriggerLabel,
  buildToggleCategoryHref,
  buildToggleSubcategoryHref,
  hasSingleSubcategoryCategorySelection,
} from "./transactions-view-model";

type CategoryMenuOption = {
  value: string;
  label: string;
};

type TransactionsFilterControlsProps = {
  filters: TransactionsControlState;
  categories: CategoryOption[];
  categoryOptions: CategoryMenuOption[];
  subcategoryOptions: CategoryMenuOption[];
  mode?: "immediate" | "draft";
  variant?: "desktop" | "mobile-sheet";
  onFiltersChange?: (filters: TransactionsControlState) => void;
  renderMenusInPortal?: boolean;
  menuPortalZIndex?: number;
};

export function TransactionsFilterControls({
  filters,
  categories,
  categoryOptions,
  subcategoryOptions,
  mode = "immediate",
  variant = "desktop",
  onFiltersChange,
  renderMenusInPortal = true,
  menuPortalZIndex = 80,
}: TransactionsFilterControlsProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const categoryTriggerLabel = buildCategoryTriggerLabel(filters);
  const subcategoryTriggerLabel = buildSubcategoryTriggerLabel(filters);
  const subcategoryEnabled = hasSingleSubcategoryCategorySelection(filters);
  const subcategoryDisabled = !subcategoryEnabled || subcategoryOptions.length === 0;
  const isDraftMode = mode === "draft";
  const isMobileSheet = variant === "mobile-sheet";

  useEffect(() => {
    if (isDraftMode) {
      return;
    }

    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (searchInputRef.current && searchInputRef.current.value !== filters.q) {
      searchInputRef.current.value = filters.q;
    }
  }, [filters.q, isDraftMode]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  function updateDraft(nextFilters: TransactionsControlState) {
    onFiltersChange?.(nextFilters);
  }

  function getNextRangeLabel(
    range: TransactionsControlState["range"],
    startDate: string | null,
    endDate: string | null
  ) {
    if (range === "custom") {
      if (!startDate || !endDate) {
        return "Custom range";
      }

      return getDashboardRangeState({
        searchParams: {
          range,
          startDate,
          endDate,
        },
      }).label;
    }

    return getDashboardRangeState({
      searchParams: {
        range,
      },
    }).label;
  }

  function updateDraftRange(
    range: TransactionsControlState["range"],
    overrides: {
      startDate?: string | null;
      endDate?: string | null;
    } = {}
  ) {
    const nextStartDate =
      overrides.startDate !== undefined ? overrides.startDate : filters.startDate;
    const nextEndDate =
      overrides.endDate !== undefined ? overrides.endDate : filters.endDate;

    if (range === "custom") {
      updateDraft({
        ...filters,
        page: 1,
        range,
        startDate: nextStartDate,
        endDate: nextEndDate,
        rangeLabel: getNextRangeLabel(range, nextStartDate, nextEndDate),
      });
      return;
    }

    const rangeState = getDashboardRangeState({
      searchParams: {
        range,
      },
    });

    updateDraft({
      ...filters,
      page: 1,
      range,
      startDate: rangeState.startDate,
      endDate: rangeState.endDate,
      rangeLabel: rangeState.label,
    });
  }

  function toggleCategory(category: string) {
    const nextCategories = filters.categories.includes(category)
      ? filters.categories.filter((value) => value !== category)
      : [...filters.categories, category];
    const singleCategorySelected =
      nextCategories.filter((value) => value.toLowerCase() !== "uncategorized").length === 1;
    const allowedSubcategories = singleCategorySelected
      ? new Set(
          categories
            .filter((option) =>
              nextCategories
                .filter((value) => value.toLowerCase() !== "uncategorized")
                .map((value) => value.toLowerCase())
                .includes(option.name.toLowerCase())
            )
            .flatMap((option) => option.subcategories.map((subcategory) => subcategory.name))
        )
      : new Set<string>();

    updateDraft({
      ...filters,
      q: filters.q.trim(),
      page: 1,
      categories: nextCategories,
      subcategories: filters.subcategories.filter((subcategory) =>
        allowedSubcategories.has(subcategory)
      ),
      status:
        filters.status === "uncategorized" &&
        nextCategories.some((value) => value.toLowerCase() === "uncategorized")
          ? "uncategorized"
          : null,
    });
  }

  function clearCategoriesDraft() {
    updateDraft({
      ...filters,
      page: 1,
      categories: [],
      subcategories: [],
      status: null,
    });
  }

  function toggleSubcategory(subcategory: string) {
    updateDraft({
      ...filters,
      q: filters.q.trim(),
      page: 1,
      subcategories: filters.subcategories.includes(subcategory)
        ? filters.subcategories.filter((value) => value !== subcategory)
        : [...filters.subcategories, subcategory],
    });
  }

  function clearSubcategoriesDraft() {
    updateDraft({
      ...filters,
      page: 1,
      subcategories: [],
    });
  }

  function resetDraftFilters() {
    updateDraft(buildResetFilterState(filters));
  }

  const categoryMenuOptions = [
    {
      label: "All categories",
      selected: filters.categories.length === 0,
      onSelect: isDraftMode
        ? clearCategoriesDraft
        : () => updateTransactionsUrl(buildClearCategoriesHref(filters), "replace"),
    },
    {
      label: "Uncategorized",
      selected: filters.categories.includes("Uncategorized"),
      onSelect: isDraftMode
        ? () => toggleCategory("Uncategorized")
        : () =>
            updateTransactionsUrl(
              buildToggleCategoryHref(filters, "Uncategorized", categories),
              "replace"
            ),
    },
    ...categoryOptions.map((option) => ({
      label: option.label,
      selected: filters.categories.includes(option.value),
      onSelect: isDraftMode
        ? () => toggleCategory(option.value)
        : () =>
            updateTransactionsUrl(
              buildToggleCategoryHref(filters, option.value, categories),
              "replace"
            ),
    })),
  ];

  const subcategoryMenuOptions = [
    {
      label: "All subcategories",
      selected: filters.subcategories.length === 0,
      onSelect: isDraftMode
        ? clearSubcategoriesDraft
        : () => updateTransactionsUrl(buildClearSubcategoriesHref(filters), "replace"),
    },
    ...subcategoryOptions.map((option) => ({
      label: option.label,
      selected: filters.subcategories.includes(option.value),
      onSelect: isDraftMode
        ? () => toggleSubcategory(option.value)
        : () =>
            updateTransactionsUrl(buildToggleSubcategoryHref(filters, option.value), "replace"),
    })),
  ];

  if (isMobileSheet) {
    return (
      <div className="space-y-5">
        <FilterSection number="1" title="Time period">
          <MobileTimePeriodRow
            value={filters.range}
            quickRanges={quickDashboardRanges}
            secondaryRanges={mobileDashboardSecondaryRanges}
            onSelect={updateDraftRange}
            renderMenuInPortal={renderMenusInPortal}
            menuPortalZIndex={menuPortalZIndex}
          />
        </FilterSection>

        <FilterSection number="2" title="Category">
          <FilterMenu
            label="Filter categories"
            triggerLabel={categoryTriggerLabel}
            renderInPortal={renderMenusInPortal}
            portalZIndex={menuPortalZIndex}
            closeOnSelect={false}
            options={categoryMenuOptions}
          />
        </FilterSection>

        <FilterSection number="3" title="Subcategory">
          <FilterMenu
            label="Filter subcategories"
            triggerLabel={subcategoryTriggerLabel}
            disabled={subcategoryDisabled}
            disabledLabel={subcategoryEnabled ? "No subcategories" : "Choose one category first"}
            renderInPortal={renderMenusInPortal}
            portalZIndex={menuPortalZIndex}
            closeOnSelect={false}
            options={subcategoryMenuOptions}
          />
        </FilterSection>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_minmax(11rem,0.28fr)_minmax(11rem,0.28fr)_3rem]">
      <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5">
        <Search className="h-4 w-4 text-secondary-foreground" />
        <input
          ref={searchInputRef}
          value={isDraftMode ? filters.q : undefined}
          defaultValue={isDraftMode ? undefined : filters.q}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (isDraftMode) {
              updateDraft({
                ...filters,
                q: nextValue,
                page: 1,
              });
              return;
            }

            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = window.setTimeout(() => {
              const nextHref = buildSearchHref(filters, nextValue);
              updateTransactionsUrl(nextHref, "replace");
            }, 300);
          }}
          placeholder="Search recipient, remarks, amount..."
          className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/85"
        />
      </label>

      <FilterMenu
        label="Filter categories"
        triggerLabel={categoryTriggerLabel}
        renderInPortal={renderMenusInPortal}
        portalZIndex={menuPortalZIndex}
        options={categoryMenuOptions}
      />

      <FilterMenu
        label="Filter subcategories"
        triggerLabel={subcategoryTriggerLabel}
        disabled={subcategoryDisabled}
        disabledLabel={subcategoryEnabled ? "No subcategories" : "Select one category first"}
        renderInPortal={renderMenusInPortal}
        portalZIndex={menuPortalZIndex}
        options={subcategoryMenuOptions}
      />

      <div className="flex items-center lg:justify-end">
        <button
          type="button"
          aria-label="Reset filters"
          title="Reset filters"
          onClick={() => {
            if (isDraftMode) {
              resetDraftFilters();
              return;
            }

            updateTransactionsUrl(buildResetHref(filters), "replace");
          }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-border/50 bg-background/10 text-secondary-foreground transition-colors hover:border-border/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FilterSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border/40 pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{number}.</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FilterMenu({
  label,
  triggerLabel,
  options,
  disabled = false,
  disabledLabel,
  renderInPortal = true,
  portalZIndex = 80,
  closeOnSelect = true,
  triggerClassName,
  triggerLabelClassName,
  triggerIconClassName,
  triggerActive = false,
  menuClassName,
}: {
  label: string;
  triggerLabel: string;
  options: Array<{
    label: string;
    selected: boolean;
    onSelect: () => void;
  }>;
  disabled?: boolean;
  disabledLabel?: string;
  renderInPortal?: boolean;
  portalZIndex?: number;
  closeOnSelect?: boolean;
  triggerClassName?: string;
  triggerLabelClassName?: string;
  triggerIconClassName?: string;
  triggerActive?: boolean;
  menuClassName?: string;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !renderInPortal) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = Math.max(rect.width, 220);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - minWidth - 12));

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        width: rect.width,
        minWidth,
        zIndex: portalZIndex,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, portalZIndex, renderInPortal]);

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

  const menuContent = (
    <div
      ref={menuPanelRef}
      role="listbox"
      style={renderInPortal ? menuStyle : undefined}
      className={cn(
        "overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]",
        renderInPortal
          ? ""
          : "absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full min-w-[220px]",
        menuClassName
      )}
    >
      <div className="border-b border-border/45 px-3 py-2 text-xs font-semibold text-secondary-foreground">
        {label}
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        {options.map((option) => (
          <FilterOptionButton
            key={option.label}
            label={option.label}
            selected={option.selected}
            onSelect={() => {
              if (closeOnSelect) {
                setIsOpen(false);
              }
              option.onSelect();
            }}
          />
        ))}
      </div>
    </div>
  );

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
          (isOpen || triggerActive) && "border-primary/70 bg-primary/14 text-primary",
          disabled && "cursor-not-allowed text-secondary-foreground/55 hover:bg-background/16",
          triggerClassName
        )}
      >
        <span className={cn("truncate", triggerLabelClassName)}>
          {disabled ? disabledLabel ?? triggerLabel : triggerLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            isOpen && "rotate-180",
            triggerIconClassName
          )}
        />
      </button>

      {isOpen && !disabled
        ? renderInPortal
          ? createPortal(menuContent, document.body)
          : menuContent
        : null}
    </div>
  );
}

function FilterOptionButton({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-secondary/20",
        selected
          ? "bg-primary/12 text-primary hover:bg-primary/16"
          : "text-foreground hover:bg-secondary/20"
      )}
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}
