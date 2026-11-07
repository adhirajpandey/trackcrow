"use client";

import { useRouter } from "next/navigation";

import { MobileTimePeriodRow } from "@/components/product/mobile/mobile-time-period-row";
import {
  dashboardRangeCookieName,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";
import { TimeframePicker } from "@/components/product/timeframe-picker";
import {
  quickDashboardRanges,
  secondaryDashboardRanges,
} from "@/features/dashboard/timeframe-options";

function persistRange(range: DashboardRangeValue) {
  document.cookie = `${dashboardRangeCookieName}=${range}; path=/; max-age=31536000; samesite=lax`;
}

function buildDashboardUrl(
  range: DashboardRangeValue,
  startDate?: string,
  endDate?: string,
  path = "/dashboard",
  extraParams: Record<string, string> = {}
) {
  const params = new URLSearchParams({ ...extraParams, range });
  if (range === "custom" && startDate && endDate) {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  return `${path}?${params.toString()}`;
}

type RangeTarget = {
  /** Page the picker navigates to; the range is shared through a cookie. */
  path?: string;
  /** Params to keep, such as the Insights tab. */
  extraParams?: Record<string, string>;
};

export function DashboardMobileTimePeriodRow({
  value,
  startDate,
  endDate,
  path,
  extraParams,
}: {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
} & RangeTarget) {
  const router = useRouter();

  return (
    <MobileTimePeriodRow
      value={value}
      quickRanges={quickDashboardRanges}
      secondaryRanges={secondaryDashboardRanges}
      startDate={startDate}
      endDate={endDate}
      onSelect={(range, nextStartDate, nextEndDate) => {
        persistRange(range);
        router.push(buildDashboardUrl(range, nextStartDate, nextEndDate, path, extraParams));
      }}
      renderMenuInPortal
    />
  );
}

export function DashboardTimeframePicker({
  value,
  startDate,
  endDate,
  path,
  extraParams,
}: {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
} & RangeTarget) {
  return (
    <TimeframePicker
      value={value}
      startDate={startDate}
      endDate={endDate}
      quickRanges={quickDashboardRanges}
      secondaryRanges={secondaryDashboardRanges}
      buildHref={(range, start, end) => buildDashboardUrl(range, start, end, path, extraParams)}
      persistSelection={persistRange}
      showQuickRanges
      idPrefix="dashboard"
      renderMenuInPortal
    />
  );
}
