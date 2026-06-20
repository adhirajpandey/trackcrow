"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  dashboardRangeCookieName,
  dashboardRangeValues,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";

const labels: Record<DashboardRangeValue, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "last-6-months": "Last 6 months",
  "this-year": "This year",
  "last-12-months": "Last 12 months",
  "all-time": "All time",
  custom: "Custom range",
};

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
  const [selectedRange, setSelectedRange] = useState<DashboardRangeValue>(value);
  const [customStartDate, setCustomStartDate] = useState(startDate ?? "");
  const [customEndDate, setCustomEndDate] = useState(endDate ?? "");

  function navigate(range: DashboardRangeValue, nextStartDate?: string, nextEndDate?: string) {
    persistRange(range);
    router.push(buildDashboardUrl(range, nextStartDate, nextEndDate));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="dashboard-range">
        Dashboard timeframe
      </label>
      <select
        id="dashboard-range"
        value={selectedRange}
        onChange={(event) => {
          const nextRange = event.target.value as DashboardRangeValue;
          setSelectedRange(nextRange);
          if (nextRange !== "custom") {
            navigate(nextRange);
          }
        }}
        className="min-h-9 rounded-md border border-input bg-secondary px-3 text-sm font-semibold text-secondary-foreground shadow-sm shadow-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {dashboardRangeValues.map((range) => (
          <option key={range} value={range}>
            {labels[range]}
          </option>
        ))}
      </select>

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
            className="min-h-9 rounded-md border border-input bg-muted px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <label className="sr-only" htmlFor="dashboard-end-date">
            End date
          </label>
          <input
            id="dashboard-end-date"
            type="date"
            value={customEndDate}
            onChange={(event) => setCustomEndDate(event.target.value)}
            className="min-h-9 rounded-md border border-input bg-muted px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={!customStartDate || !customEndDate}
            className="min-h-9 rounded-md border border-primary/40 bg-primary/15 px-3 text-sm font-semibold text-primary transition-colors hover:border-primary disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Apply
          </button>
        </form>
      ) : null}
    </div>
  );
}
