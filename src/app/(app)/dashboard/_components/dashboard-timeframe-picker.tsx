"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronDown } from "lucide-react";

import {
  dashboardRangeCookieName,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";
import { cn } from "@/lib/utils";
import {
  quickDashboardRanges,
  secondaryDashboardRanges,
} from "./dashboard-view-model";

function persistRange(range: DashboardRangeValue) {
  document.cookie = `${dashboardRangeCookieName}=${range}; path=/; max-age=31536000; samesite=lax`;
}

function buildDashboardUrl(range: DashboardRangeValue, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ range });
  if (range === "custom" && startDate && endDate) {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  return `/dashboard?${params.toString()}`;
}

function getRangeLabel(
  value: DashboardRangeValue,
  fallbackLabel?: string
) {
  return (
    quickDashboardRanges.find((range) => range.value === value)?.label ??
    secondaryDashboardRanges.find((range) => range.value === value)?.label ??
    fallbackLabel ??
    "More ranges"
  );
}

type TimeframePickerProps = {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
  buildHref: (range: DashboardRangeValue, startDate?: string, endDate?: string) => string;
  persistSelection?: (range: DashboardRangeValue) => void;
  showQuickRanges?: boolean;
  showSelectedLabelInTrigger?: boolean;
  selectedLabel?: string;
  idPrefix?: string;
  rootClassName?: string;
  triggerWrapperClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  renderMenuInPortal?: boolean;
  autoApplyCustomRange?: boolean;
  showCustomApplyButton?: boolean;
};

export function TimeframePicker({
  value,
  startDate,
  endDate,
  buildHref,
  persistSelection,
  showQuickRanges = true,
  showSelectedLabelInTrigger = false,
  selectedLabel,
  idPrefix = "timeframe",
  rootClassName,
  triggerWrapperClassName,
  triggerClassName,
  menuClassName,
  renderMenuInPortal = false,
  autoApplyCustomRange = false,
  showCustomApplyButton = true,
}: TimeframePickerProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedRange, setSelectedRange] = useState<DashboardRangeValue>(value);
  const [customStartDate, setCustomStartDate] = useState(startDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(endDate ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | undefined>(undefined);
  const secondaryRangeValue = secondaryDashboardRanges.some(
    (range) => range.value === selectedRange
  )
    ? selectedRange
    : "";

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
      router.push(buildHref(range, nextStartDate, nextEndDate));
    },
    [buildHref, persistSelection, router]
  );

  useEffect(() => {
    if (!autoApplyCustomRange || selectedRange !== "custom") {
      return;
    }

    if (!customStartDate || !customEndDate) {
      return;
    }

    const nextHref = buildHref("custom", customStartDate, customEndDate);
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (nextHref !== currentHref) {
      navigate("custom", customStartDate, customEndDate);
    }
  }, [autoApplyCustomRange, buildHref, customEndDate, customStartDate, navigate, selectedRange]);

  useEffect(() => {
    if (!isOpen || !renderMenuInPortal) {
      return;
    }

    function updatePortalPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const minWidth = Math.max(rect.width, 220);
      const left = Math.max(12, Math.min(rect.right - minWidth, window.innerWidth - minWidth - 12));

      setPortalStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left,
        minWidth,
        zIndex: 80,
      });
    }

    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [isOpen, renderMenuInPortal]);

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

  const triggerLabel = showSelectedLabelInTrigger
    ? getRangeLabel(selectedRange, selectedLabel)
    : "More ranges";

  const menuContent = (
    <div
      ref={menuPanelRef}
      role="menu"
      style={renderMenuInPortal ? portalStyle : undefined}
      className={cn(
        "rounded-[8px] border border-border/80 bg-popover p-2 shadow-2xl shadow-background/50",
        renderMenuInPortal
          ? "max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto"
          : "absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[220px]",
        menuClassName
      )}
    >
      {secondaryDashboardRanges.map((range) => {
        const active = secondaryRangeValue === range.value;

        return (
          <button
            key={range.value}
            type="button"
            role="menuitem"
            onClick={() => {
              setSelectedRange(range.value);
              setIsOpen(false);
              if (range.value !== "custom") {
                navigate(range.value);
              }
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary/75 text-foreground"
                : "text-secondary-foreground hover:bg-secondary/55 hover:text-foreground"
            )}
          >
            <span>{range.label}</span>
            {active ? <span className="text-xs text-primary">Current</span> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", rootClassName)}>
      {showQuickRanges ? (
        <div className="flex rounded-[8px] border border-border/55 bg-[rgba(9,18,14,0.80)] p-1">
          {quickDashboardRanges.map((range) => {
            const active = selectedRange === range.value;

            return (
              <button
                key={range.value}
                type="button"
                title={range.label}
                aria-pressed={active}
                onClick={() => {
                  setSelectedRange(range.value);
                  navigate(range.value);
                }}
                className={`min-h-8 rounded-[6px] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-border/55 bg-[rgba(9,18,14,0.80)] px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

      {selectedRange === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-start-date`}>
            Start date
          </label>
          <input
            id={`${idPrefix}-start-date`}
            type="date"
            value={customStartDate}
            onChange={(event) => setCustomStartDate(event.target.value)}
            className="min-h-9 rounded-[8px] border border-input bg-background/24 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <label className="sr-only" htmlFor={`${idPrefix}-end-date`}>
            End date
          </label>
          <input
            id={`${idPrefix}-end-date`}
            type="date"
            value={customEndDate}
            onChange={(event) => setCustomEndDate(event.target.value)}
            className="min-h-9 rounded-[8px] border border-input bg-background/24 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {showCustomApplyButton ? (
            <button
              type="button"
              onClick={() => {
                if (customStartDate && customEndDate) {
                  navigate("custom", customStartDate, customEndDate);
                }
              }}
              disabled={!customStartDate || !customEndDate}
              className="min-h-9 rounded-[8px] border border-primary/40 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Apply
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardTimeframePicker({
  value,
  startDate,
  endDate,
}: {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
}) {
  return (
    <TimeframePicker
      value={value}
      startDate={startDate}
      endDate={endDate}
      buildHref={buildDashboardUrl}
      persistSelection={persistRange}
      showQuickRanges
      showSelectedLabelInTrigger={false}
      idPrefix="dashboard"
    />
  );
}
