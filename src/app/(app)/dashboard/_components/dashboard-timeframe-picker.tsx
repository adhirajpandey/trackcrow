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

function buildDashboardUrl(range: DashboardRangeValue, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ range });
  if (range === "custom" && startDate && endDate) {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  return `/dashboard?${params.toString()}`;
}

export function DashboardMobileTimePeriodRow({
  value,
  startDate,
  endDate,
}: {
  value: DashboardRangeValue;
  startDate: string | null;
  endDate: string | null;
}) {
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
        router.push(buildDashboardUrl(range, nextStartDate, nextEndDate));
      }}
      renderMenuInPortal
    />
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
      quickRanges={quickDashboardRanges}
      secondaryRanges={secondaryDashboardRanges}
      buildHref={buildDashboardUrl}
      persistSelection={persistRange}
      showQuickRanges
      idPrefix="dashboard"
      renderMenuInPortal
    />
  );
}
