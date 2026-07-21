"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import {
  getTimeframeTriggerLabel,
  isSecondaryTimeframe,
  isValidCustomRange,
} from "@/features/dashboard/timeframe-options";
import { cn } from "@/lib/utils";

export type MobileTimePeriodOption = {
  value: DashboardRangeValue;
  label: string;
};

export type MobileTimePeriodRowProps = {
  value: DashboardRangeValue;
  quickRanges: MobileTimePeriodOption[];
  secondaryRanges: MobileTimePeriodOption[];
  startDate?: string | null;
  endDate?: string | null;
  onSelect: (range: DashboardRangeValue, startDate?: string, endDate?: string) => void;
  customRangeBehavior?: "popover" | "select";
  renderMenuInPortal?: boolean;
  menuPortalZIndex?: number;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

const activeRangeClassName =
  "border-primary/70 bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(104,211,145,0.18)]";

export function MobileTimePeriodRow({
  value,
  quickRanges,
  secondaryRanges,
  startDate,
  endDate,
  onSelect,
  customRangeBehavior = "popover",
  renderMenuInPortal = true,
  menuPortalZIndex = 80,
  menuOpen,
  onMenuOpenChange,
}: MobileTimePeriodRowProps) {
  const moreRangeActive = isSecondaryTimeframe(value);

  return (
    <div className="flex flex-wrap gap-2">
      {quickRanges.map((range) => {
        const active = value === range.value;

        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(range.value)}
            className={cn(
              "min-h-11 min-w-[3.25rem] flex-1 basis-[3.25rem] rounded-[8px] border px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? activeRangeClassName
                : "border-border/55 bg-background/10 text-secondary-foreground hover:bg-background/16 hover:text-foreground"
            )}
          >
            {range.label}
          </button>
        );
      })}
      <MoreTimePeriodsMenu
        value={value}
        options={secondaryRanges}
        startDate={startDate}
        endDate={endDate}
        onSelect={onSelect}
        customRangeBehavior={customRangeBehavior}
        triggerActive={moreRangeActive}
        renderInPortal={renderMenuInPortal}
        portalZIndex={menuPortalZIndex}
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
      />
    </div>
  );
}

function MoreTimePeriodsMenu({
  value,
  options,
  startDate,
  endDate,
  onSelect,
  triggerActive,
  customRangeBehavior,
  renderInPortal,
  portalZIndex,
  open,
  onOpenChange,
}: {
  value: DashboardRangeValue;
  options: MobileTimePeriodOption[];
  startDate?: string | null;
  endDate?: string | null;
  onSelect: (range: DashboardRangeValue, startDate?: string, endDate?: string) => void;
  triggerActive: boolean;
  customRangeBehavior: "popover" | "select";
  renderInPortal: boolean;
  portalZIndex: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setMenuOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open]
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties | undefined>(undefined);
  const [draftRange, setDraftRange] = useState(value);
  const [customStartDate, setCustomStartDate] = useState(startDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(endDate ?? "");
  const [customError, setCustomError] = useState<string | null>(null);
  const showingCustomForm = customRangeBehavior === "popover" && draftRange === "custom";

  useEffect(() => {
    if (!isOpen || !renderInPortal) {
      return;
    }

    function updateMenuPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = Math.min(showingCustomForm ? 342 : 216, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.right - minWidth, window.innerWidth - minWidth - 12));

      setMenuStyle({
        position: "fixed",
        top: rect.bottom - 1,
        left,
        width: minWidth,
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
  }, [isOpen, portalZIndex, renderInPortal, showingCustomForm]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current?.contains(target);
      const clickedInsideMenu = menuPanelRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setMenuOpen(false);
        setDraftRange(value);
        setCustomStartDate(startDate ?? "");
        setCustomEndDate(endDate ?? "");
        setCustomError(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setDraftRange(value);
        setCustomStartDate(startDate ?? "");
        setCustomEndDate(endDate ?? "");
        setCustomError(null);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
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
  }, [endDate, isOpen, setMenuOpen, startDate, value]);

  const menuContent = (
    <div
      ref={menuPanelRef}
      role="dialog"
      aria-label="Choose timeframe"
      style={renderInPortal ? menuStyle : undefined}
      className={cn(
        "overflow-hidden rounded-[10px] rounded-tr-none border-2 border-border bg-card shadow-[3px_4px_0_var(--foreground)]",
        renderInPortal ? "" : "relative mt-2 w-full"
      )}
    >
      <div className="border-b border-border/45 px-3 py-2 text-xs font-semibold text-secondary-foreground">
        More time periods
      </div>
      <div
        className={cn(
          "scrollbar-none py-1",
          renderInPortal && "max-h-56 overflow-y-auto"
        )}
      >
        {options.map((option) => {
          const selected = draftRange === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setDraftRange(option.value);
                setCustomError(null);
                if (option.value === "custom" && customRangeBehavior === "popover") {
                  return;
                }

                setMenuOpen(false);
                onSelect(option.value);
              }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selected
                  ? "bg-primary/12 text-primary hover:bg-primary/16"
                  : "text-foreground hover:bg-secondary/20"
              )}
            >
              <span className="truncate">{option.label}</span>
              {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </button>
          );
        })}
      </div>
      {showingCustomForm ? (
        <div className="space-y-3 border-t-2 border-dashed border-border/45 p-3">
          <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
            Start date
            <input
              type="date"
              value={customStartDate}
              onChange={(event) => {
                setCustomStartDate(event.target.value);
                setCustomError(null);
              }}
              className="min-h-11 rounded-[8px] border-2 border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
            End date
            <input
              type="date"
              value={customEndDate}
              onChange={(event) => {
                setCustomEndDate(event.target.value);
                setCustomError(null);
              }}
              className="min-h-11 rounded-[8px] border-2 border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {customError ? (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {customError}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setDraftRange(value);
                setCustomStartDate(startDate ?? "");
                setCustomEndDate(endDate ?? "");
                setCustomError(null);
                window.requestAnimationFrame(() => triggerRef.current?.focus());
              }}
              className="min-h-11 rounded-[8px] border-2 border-border bg-card px-3 text-sm font-bold text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!customStartDate || !customEndDate}
              onClick={() => {
                if (!isValidCustomRange(customStartDate, customEndDate)) {
                  setCustomError("Start date must be on or before end date.");
                  return;
                }
                setMenuOpen(false);
                onSelect("custom", customStartDate, customEndDate);
              }}
              className="min-h-11 rounded-[8px] border-2 border-primary/50 bg-primary px-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      ref={menuRef}
      className={cn(
        "relative min-w-[6.75rem] flex-[1.5] basis-[6.75rem]",
        !renderInPortal && isOpen && "w-full flex-none basis-full"
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) {
            setDraftRange(value);
            setCustomStartDate(startDate ?? "");
            setCustomEndDate(endDate ?? "");
            setCustomError(null);
          } else {
            setDraftRange(value);
            setCustomStartDate(startDate ?? "");
            setCustomEndDate(endDate ?? "");
            setCustomError(null);
          }
          setMenuOpen(!isOpen);
        }}
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-border/50 bg-background/16 px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "rounded-b-none",
          isOpen && !triggerActive && "border-primary/70 bg-primary/14 text-primary",
          triggerActive && activeRangeClassName
        )}
      >
        <span className="truncate text-center">
          {triggerActive ? getTimeframeTriggerLabel(value) : "More"}
        </span>
        <ChevronDown className="hidden h-4 w-4 shrink-0 transition-transform" aria-hidden="true" />
      </button>

      {isOpen
        ? renderInPortal
          ? createPortal(menuContent, document.body)
          : menuContent
        : null}
    </div>
  );
}
