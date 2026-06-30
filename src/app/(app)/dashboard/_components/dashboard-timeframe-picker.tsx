"use client";

import {
  dashboardRangeCookieName,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";
import { TimeframePicker } from "@/components/product/timeframe-picker";
import {
  buildDashboardTimeframeTriggerLabel,
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
  return (
    <TimeframePicker
      value={value}
      startDate={startDate}
      endDate={endDate}
      quickRanges={quickDashboardRanges}
      secondaryRanges={secondaryDashboardRanges}
      buildHref={buildDashboardUrl}
      buildTriggerLabel={buildDashboardTimeframeTriggerLabel}
      persistSelection={persistRange}
      showQuickRanges
      showSelectedLabelInTrigger={false}
      idPrefix="dashboard"
    />
  );
}
