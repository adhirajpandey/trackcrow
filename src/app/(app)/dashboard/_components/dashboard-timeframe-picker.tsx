"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronDown } from "lucide-react";

import {
  dashboardRangeCookieName,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";
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

export function DashboardTimeframePicker({
  value,
  startDate,
  endDate,
}: {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [selectedRange, setSelectedRange] = useState<DashboardRangeValue>(value);
  const [customStartDate, setCustomStartDate] = useState(startDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(endDate ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const secondaryRangeValue = secondaryDashboardRanges.some(
    (range) => range.value === selectedRange
  )
    ? selectedRange
    : "";

  function navigate(range: DashboardRangeValue, nextStartDate?: string, nextEndDate?: string) {
    persistRange(range);
    router.push(buildDashboardUrl(range, nextStartDate, nextEndDate));
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
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
    <div className="flex flex-wrap items-center gap-2.5">
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
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-border/55 bg-[rgba(9,18,14,0.80)] px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          More ranges
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-[220px] rounded-[8px] border border-border/80 bg-popover p-2 shadow-2xl shadow-background/50"
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
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "bg-secondary/75 text-foreground"
                      : "text-secondary-foreground hover:bg-secondary/55 hover:text-foreground"
                  }`}
                >
                  <span>{range.label}</span>
                  {active ? <span className="text-xs text-primary">Current</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedRange === "custom" ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (customStartDate && customEndDate) {
              navigate("custom", customStartDate, customEndDate);
            }
          }}
        >
          <label className="sr-only" htmlFor="dashboard-start-date">
            Start date
          </label>
          <input
            id="dashboard-start-date"
            type="date"
            value={customStartDate}
            onChange={(event) => setCustomStartDate(event.target.value)}
            className="min-h-9 rounded-[8px] border border-input bg-background/24 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <label className="sr-only" htmlFor="dashboard-end-date">
            End date
          </label>
          <input
            id="dashboard-end-date"
            type="date"
            value={customEndDate}
            onChange={(event) => setCustomEndDate(event.target.value)}
            className="min-h-9 rounded-[8px] border border-input bg-background/24 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!customStartDate || !customEndDate}
            className="min-h-9 rounded-[8px] border border-primary/40 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Apply
          </button>
        </form>
      ) : null}
    </div>
  );
}
