"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import type { CategoryOption } from "@/common/types";
import {
  FilterResetButton,
  FilterSection,
  ListSearchField,
} from "@/components/product/list-filter-controls";
import { MobileTimePeriodRow } from "@/components/product/mobile/mobile-time-period-row";
import { getDashboardRangeState } from "@/features/dashboard/query-state";
import {
  quickDashboardRanges,
  secondaryDashboardRanges,
} from "@/features/dashboard/timeframe-options";
import type { TransactionsControlState } from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { cn } from "@/lib/utils";

import {
  buildCategoryTriggerLabel,
  buildApplyFiltersHref,
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
  const categoryTriggerLabel = buildCategoryTriggerLabel(filters);
  const subcategoryTriggerLabel = buildSubcategoryTriggerLabel(filters);
  const subcategoryEnabled = hasSingleSubcategoryCategorySelection(filters);
  const assignmentTriggerLabel =
    filters.classificationSources.length === 0
      ? "All assignments"
      : filters.classificationSources.length === 1
        ? ({ MANUAL: "Manual", SUGGESTION: "Suggestion", RULE: "Rule" } as const)[filters.classificationSources[0]]
        : `${filters.classificationSources.length} assignments`;
  const subcategoryDisabled = !subcategoryEnabled || subcategoryOptions.length === 0;
  const isDraftMode = mode === "draft";
  const isMobileSheet = variant === "mobile-sheet";
  const [openMobileMenu, setOpenMobileMenu] = useState<
    "time" | "category" | "subcategory" | "assignment" | null
  >(null);

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

  function setAssignmentSources(
    classificationSources: TransactionsControlState["classificationSources"]
  ) {
    const next = { ...filters, page: 1, classificationSources };
    if (isDraftMode) {
      updateDraft(next);
    } else {
      updateTransactionsUrl(buildApplyFiltersHref(next), "replace");
    }
  }

  const assignmentMenuOptions = [
    {
      label: "All assignments",
      selected: filters.classificationSources.length === 0,
      onSelect: () => setAssignmentSources([]),
    },
    ...(["MANUAL", "SUGGESTION", "RULE"] as const).map((source) => ({
      label: ({ MANUAL: "Manual", SUGGESTION: "Suggestion", RULE: "Rule" } as const)[source],
      selected: filters.classificationSources.includes(source),
      onSelect: () =>
        setAssignmentSources(
          filters.classificationSources.includes(source)
            ? filters.classificationSources.filter((value) => value !== source)
            : [...filters.classificationSources, source]
        ),
    })),
  ];

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
  const resetDisabled =
    !filters.q &&
    filters.sortBy === "timestamp" &&
    filters.sortOrder === "desc" &&
    filters.categories.length === 0 &&
    filters.subcategories.length === 0 &&
    filters.classificationSources.length === 0 &&
    filters.selectedTransactionUuid === null &&
    filters.review === null &&
    filters.status === null;

  if (isMobileSheet) {
    return (
      <div className="space-y-5">
        <FilterSection number="1" title="Time period">
          <MobileTimePeriodRow
            value={filters.range}
            quickRanges={quickDashboardRanges}
            secondaryRanges={secondaryDashboardRanges}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onSelect={(range, startDate, endDate) => {
              setOpenMobileMenu(null);
              updateDraftRange(range, {
                ...(startDate !== undefined ? { startDate } : {}),
                ...(endDate !== undefined ? { endDate } : {}),
              });
            }}
            customRangeBehavior="select"
            renderMenuInPortal={renderMenusInPortal}
            menuPortalZIndex={menuPortalZIndex}
            menuOpen={openMobileMenu === "time"}
            onMenuOpenChange={(open) => setOpenMobileMenu(open ? "time" : null)}
          />
          {filters.range === "custom" ? (
            <div className="grid gap-3 rounded-[8px] border-2 border-dashed border-border/45 bg-background/12 p-3">
              <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
                Start date
                <input
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) =>
                    updateDraftRange("custom", { startDate: event.target.value || null })
                  }
                  className="min-h-11 rounded-[8px] border-2 border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
                End date
                <input
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(event) =>
                    updateDraftRange("custom", { endDate: event.target.value || null })
                  }
                  className="min-h-11 rounded-[8px] border-2 border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              {filters.startDate && filters.endDate && filters.startDate > filters.endDate ? (
                <p role="alert" className="text-xs font-semibold text-destructive">
                  Start date must be on or before end date.
                </p>
              ) : null}
            </div>
          ) : null}
        </FilterSection>

        <FilterSection number="2" title="Category">
          <FilterMenu
            label="Filter categories"
            triggerLabel={categoryTriggerLabel}
            renderInPortal={renderMenusInPortal}
            portalZIndex={menuPortalZIndex}
            closeOnSelect={false}
            open={openMobileMenu === "category"}
            onOpenChange={(open) => setOpenMobileMenu(open ? "category" : null)}
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
            open={openMobileMenu === "subcategory"}
            onOpenChange={(open) => setOpenMobileMenu(open ? "subcategory" : null)}
            options={subcategoryMenuOptions}
          />
        </FilterSection>
        <FilterSection number="4" title="Assignment source">
          <FilterMenu
            label="Filter assignment sources"
            triggerLabel={assignmentTriggerLabel}
            renderInPortal={renderMenusInPortal}
            portalZIndex={menuPortalZIndex}
            closeOnSelect={false}
            open={openMobileMenu === "assignment"}
            onOpenChange={(open) => setOpenMobileMenu(open ? "assignment" : null)}
            options={assignmentMenuOptions}
          />
        </FilterSection>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_minmax(10rem,0.25fr)_minmax(10rem,0.25fr)_minmax(10rem,0.25fr)_3rem]">
      <ListSearchField
        value={filters.q}
        placeholder="Search recipient, remarks, amount..."
        ariaLabel="Search transactions"
        onCommit={(nextValue) => {
          if (isDraftMode) {
            updateDraft({ ...filters, q: nextValue, page: 1 });
            return;
          }
          updateTransactionsUrl(buildSearchHref(filters, nextValue), "replace");
        }}
      />

      <FilterMenu
        label="Filter categories"
        triggerLabel={categoryTriggerLabel}
        renderInPortal={renderMenusInPortal}
        portalZIndex={menuPortalZIndex}
        options={categoryMenuOptions}
      />

      <FilterMenu
        label="Filter assignment sources"
        triggerLabel={assignmentTriggerLabel}
        renderInPortal={renderMenusInPortal}
        portalZIndex={menuPortalZIndex}
        options={assignmentMenuOptions}
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
        <FilterResetButton
          disabled={resetDisabled}
          onReset={() => {
            if (isDraftMode) {
              resetDraftFilters();
              return;
            }

            updateTransactionsUrl(buildResetHref(filters), "replace");
          }}
        />
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
  renderInPortal = true,
  portalZIndex = 80,
  closeOnSelect = true,
  triggerClassName,
  triggerLabelClassName,
  triggerIconClassName,
  triggerActive = false,
  menuClassName,
  open,
  onOpenChange,
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);
  const setMenuOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open]
  );

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
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
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
  }, [isOpen, setMenuOpen]);

  const menuContent = (
    <div
      ref={menuPanelRef}
      role="listbox"
      style={renderInPortal ? menuStyle : undefined}
      className={cn(
        "overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[3px_4px_0_var(--foreground)]",
        renderInPortal
          ? ""
          : "relative mt-2 w-full",
        menuClassName
      )}
    >
      <div className="border-b-2 border-border bg-secondary/55 px-3 py-2 text-xs font-semibold text-secondary-foreground">
        {label}
      </div>
      <div className={cn("py-1", renderInPortal && "max-h-56 overflow-y-auto")}>
        {options.map((option) => (
          <FilterOptionButton
            key={option.label}
            label={option.label}
            selected={option.selected}
            onSelect={() => {
              if (closeOnSelect) {
                setMenuOpen(false);
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
        onClick={() => setMenuOpen(!isOpen)}
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-[8px] border-2 border-border bg-card px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          (isOpen || triggerActive) && "bg-primary/35 text-foreground",
          disabled && "cursor-not-allowed text-secondary-foreground/55 hover:bg-card",
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
        "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-secondary/60",
        selected
          ? "bg-primary/35 text-foreground hover:bg-primary/45"
          : "text-foreground hover:bg-secondary/60"
      )}
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
    </button>
  );
}
