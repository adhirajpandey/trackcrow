import type { DashboardRangeValue } from "./query-state";

export type TimeframeOption = {
  value: DashboardRangeValue;
  label: string;
  triggerLabel?: string;
};

export const quickDashboardRanges: TimeframeOption[] = [
  { value: "last-30-days", label: "30D" },
  { value: "last-90-days", label: "90D" },
  { value: "this-year", label: "YTD" },
  { value: "last-12-months", label: "1Y" },
];

export const secondaryDashboardRanges: TimeframeOption[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-6-months", label: "6M" },
  { value: "all-time", label: "All time" },
  { value: "custom", label: "Custom range", triggerLabel: "Custom" },
];

const legacyTriggerLabels: Partial<Record<DashboardRangeValue, string>> = {
  "last-3-months": "3M",
};

export function getTimeframeTriggerLabel(value: DashboardRangeValue) {
  return (
    secondaryDashboardRanges.find((range) => range.value === value)?.triggerLabel ??
    secondaryDashboardRanges.find((range) => range.value === value)?.label ??
    legacyTriggerLabels[value] ??
    "More"
  );
}

export function isSecondaryTimeframe(value: DashboardRangeValue) {
  return (
    secondaryDashboardRanges.some((range) => range.value === value) ||
    value === "last-3-months"
  );
}

export function isValidCustomRange(startDate: string, endDate: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate;
}
