"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarRange, Check, ChevronDown } from "lucide-react";

import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import {
  getTimeframeTriggerLabel,
  isSecondaryTimeframe,
  isValidCustomRange,
} from "@/features/dashboard/timeframe-options";
import { cn } from "@/lib/utils";

export type TimeframePickerRange = {
  value: DashboardRangeValue;
  label: string;
};

export type TimeframePickerProps = {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
  quickRanges: TimeframePickerRange[];
  secondaryRanges: TimeframePickerRange[];
  buildHref: (range: DashboardRangeValue, startDate?: string, endDate?: string) => string;
  onNavigateHref?: (href: string) => void;
  persistSelection?: (range: DashboardRangeValue) => void;
  showQuickRanges?: boolean;
  idPrefix?: string;
  rootClassName?: string;
  triggerWrapperClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  renderMenuInPortal?: boolean;
  menuPortalZIndex?: number;
};

export function TimeframePicker({
  value,
  startDate,
  endDate,
  quickRanges,
  secondaryRanges,
  buildHref,
  onNavigateHref,
  persistSelection,
  showQuickRanges = true,
  idPrefix = "timeframe",
  rootClassName,
  triggerWrapperClassName,
  triggerClassName,
  menuClassName,
  renderMenuInPortal = false,
  menuPortalZIndex = 80,
}: TimeframePickerProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedRange, setSelectedRange] = useState<DashboardRangeValue>(value);
  const [customStartDate, setCustomStartDate] = useState(startDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(endDate ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | undefined>(undefined);
  const secondaryRangeValue = secondaryRanges.some((range) => range.value === selectedRange)
    ? selectedRange
    : "";
  const secondaryRangeActive = showQuickRanges && isSecondaryTimeframe(selectedRange);

  useEffect(() => {
    setSelectedRange(value);
  }, [value]);

  useEffect(() => {
    setCustomStartDate(startDate ?? "");
  }, [startDate]);

  useEffect(() => {
    setCustomEndDate(endDate ?? "");
  }, [endDate]);

  const navigate = useCallback(
    (range: DashboardRangeValue, nextStartDate?: string, nextEndDate?: string) => {
      persistSelection?.(range);
      const href = buildHref(range, nextStartDate, nextEndDate);
      if (onNavigateHref) {
        onNavigateHref(href);
        return;
      }
      router.push(href);
    },
    [buildHref, onNavigateHref, persistSelection, router]
  );

  useLayoutEffect(() => {
    if (!isOpen || !renderMenuInPortal) {
      return;
    }

    function updatePortalPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const gutter = 12;
      const gap = -1;
      const maxMenuHeight = 384;
      const minWidth = Math.min(
        Math.max(rect.width, selectedRange === "custom" ? 420 : 220),
        window.innerWidth - gutter * 2
      );
      const menuHeight = Math.min(menuPanelRef.current?.scrollHeight ?? maxMenuHeight, maxMenuHeight);
      const availableBelow = window.innerHeight - rect.bottom - gap - gutter;
      const availableAbove = rect.top - gap - gutter;
      const openAbove = availableBelow < menuHeight && availableAbove > availableBelow;
      const availableHeight = Math.max(0, openAbove ? availableAbove : availableBelow);
      const left = Math.max(
        gutter,
        Math.min(rect.right - minWidth, window.innerWidth - minWidth - gutter)
      );

      setPortalStyle({
        position: "fixed",
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
        left,
        minWidth,
        maxHeight: Math.min(maxMenuHeight, availableHeight),
        zIndex: menuPortalZIndex,
      });
    }

    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [isOpen, menuPortalZIndex, renderMenuInPortal, selectedRange]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current?.contains(target);
      const clickedInsideMenu = menuPanelRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsOpen(false);
        setSelectedRange(value);
        setCustomStartDate(startDate ?? "");
        setCustomEndDate(endDate ?? "");
        setCustomError(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSelectedRange(value);
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
  }, [endDate, isOpen, startDate, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.requestAnimationFrame(() => {
      const activeOption = menuPanelRef.current?.querySelector<HTMLElement>(
        '[aria-pressed="true"]'
      );
      const firstOption = menuPanelRef.current?.querySelector<HTMLElement>("button");
      (activeOption ?? firstOption)?.focus();
    });
  }, [isOpen]);

  const triggerLabel = getTimeframeTriggerLabel(selectedRange);
  const customRangeValid = isValidCustomRange(customStartDate, customEndDate);

  const menuContent = (
    <div
      ref={menuPanelRef}
      id={`${idPrefix}-range-popover`}
      role="dialog"
      aria-label="Choose timeframe"
      style={renderMenuInPortal ? portalStyle : undefined}
      className={cn(
        "rounded-[8px] rounded-tr-none border-2 border-border bg-popover p-2 shadow-[3px_4px_0_var(--foreground)]",
        renderMenuInPortal
          ? "overflow-y-auto"
          : "absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[220px]",
        menuClassName
      )}
    >
      {secondaryRanges.map((range) => {
        const active = secondaryRangeValue === range.value;

        return (
          <button
            key={range.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setSelectedRange(range.value);
              setCustomError(null);
              if (range.value === "custom") {
                return;
              }

              setIsOpen(false);
              navigate(range.value);
            }}
            className={cn(
              "flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/12 text-primary"
                : "text-secondary-foreground hover:bg-secondary/55 hover:text-foreground"
            )}
          >
            <span>{range.label}</span>
            {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          </button>
        );
      })}

      {selectedRange === "custom" ? (
        <div className="mt-2 space-y-3 border-t-2 border-dashed border-border/45 px-1 pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
              Start date
              <input
                id={`${idPrefix}-start-date`}
                type="date"
                value={customStartDate}
                onChange={(event) => {
                  setCustomStartDate(event.target.value);
                  setCustomError(null);
                }}
                className="min-h-11 rounded-[8px] border-2 border-input bg-card px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-secondary-foreground">
              End date
              <input
                id={`${idPrefix}-end-date`}
                type="date"
                value={customEndDate}
                onChange={(event) => {
                  setCustomEndDate(event.target.value);
                  setCustomError(null);
                }}
                className="min-h-11 rounded-[8px] border-2 border-input bg-card px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          {customError ? (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {customError}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRange(value);
                setCustomStartDate(startDate ?? "");
                setCustomEndDate(endDate ?? "");
                setCustomError(null);
                setIsOpen(false);
                window.requestAnimationFrame(() => triggerRef.current?.focus());
              }}
              className="min-h-10 rounded-[8px] border-2 border-border bg-card px-3 text-sm font-bold text-secondary-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!customStartDate || !customEndDate) {
                  setCustomError("Choose both a start and end date.");
                  return;
                }
                if (!customRangeValid) {
                  setCustomError("Start date must be on or before end date.");
                  return;
                }

                setIsOpen(false);
                navigate("custom", customStartDate, customEndDate);
              }}
              disabled={!customStartDate || !customEndDate}
              className="min-h-10 rounded-[8px] border-2 border-primary/50 bg-primary px-3 text-sm font-bold text-primary-foreground hover:brightness-105 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", rootClassName)}>
      {showQuickRanges ? (
        <div className="flex h-11 rounded-[8px] border-2 border-border bg-card">
          {quickRanges.map((range) => {
            const active = selectedRange === range.value;

            return (
              <button
                key={range.value}
                type="button"
                title={range.label}
                aria-pressed={active}
                onClick={() => {
                  setSelectedRange(range.value);
                  setIsOpen(false);
                  navigate(range.value);
                }}
                className={`h-10 rounded-[6px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground hover:bg-secondary/45 hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <div ref={menuRef} className={cn("relative", triggerWrapperClassName)}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-controls={`${idPrefix}-range-popover`}
          aria-expanded={isOpen}
          aria-pressed={secondaryRangeActive}
          onClick={() => {
            if (isOpen) {
              setSelectedRange(value);
              setCustomStartDate(startDate ?? "");
              setCustomEndDate(endDate ?? "");
              setCustomError(null);
            } else {
              setSelectedRange(value);
              setCustomStartDate(startDate ?? "");
              setCustomEndDate(endDate ?? "");
              setCustomError(null);
            }
            setIsOpen((current) => !current);
          }}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-[8px] border-2 border-border bg-card px-3 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isOpen && "rounded-b-none",
            secondaryRangeActive &&
              "border-primary/50 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            triggerClassName
          )}
        >
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          {triggerLabel}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isOpen
          ? renderMenuInPortal
            ? createPortal(menuContent, document.body)
            : menuContent
          : null}
      </div>

    </div>
  );
}
