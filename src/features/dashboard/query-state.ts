export const dashboardRangeValues = [
  "this-month",
  "last-30-days",
  "last-90-days",
  "last-month",
  "last-3-months",
  "last-6-months",
  "this-year",
  "last-12-months",
  "all-time",
  "custom",
] as const;

export type DashboardRangeValue = (typeof dashboardRangeValues)[number];
export type DashboardGranularity = "day" | "week" | "month" | "year";

export const dashboardRangeCookieName = "trackcrow.dashboard.range";

const IST_OFFSET_MINUTES = 330;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DashboardRangeState = {
  range: DashboardRangeValue;
  label: string;
  startDate: string | null;
  endDate: string | null;
  serviceStartDate?: Date;
  serviceEndDate?: Date;
  granularity: DashboardGranularity;
};

export type DashboardComparisonRangeState = {
  label: string;
  startDate: string;
  endDate: string;
  serviceStartDate: Date;
  serviceEndDate: Date;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isRangeValue(value: string | null | undefined): value is DashboardRangeValue {
  return dashboardRangeValues.includes(value as DashboardRangeValue);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseDateOnly(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, monthIndex: month - 1, day };
}

function getIstParts(now: Date) {
  const istDate = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return {
    year: istDate.getUTCFullYear(),
    monthIndex: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
  };
}

function startOfIstDay(value: { year: number; monthIndex: number; day: number }) {
  return new Date(
    Date.UTC(value.year, value.monthIndex, value.day) -
      IST_OFFSET_MINUTES * 60 * 1000
  );
}

function endOfIstDay(value: { year: number; monthIndex: number; day: number }) {
  return new Date(startOfIstDay(value).getTime() + MS_PER_DAY - 1);
}

function addMonths(year: number, monthIndex: number, delta: number) {
  const date = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() };
}

function addDays(value: { year: number; monthIndex: number; day: number }, delta: number) {
  const date = new Date(Date.UTC(value.year, value.monthIndex, value.day + delta));
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function buildRange(
  range: DashboardRangeValue,
  start: { year: number; monthIndex: number; day: number } | null,
  end: { year: number; monthIndex: number; day: number } | null,
  label: string,
  granularity: DashboardGranularity
): DashboardRangeState {
  return {
    range,
    label,
    startDate: start ? formatDateOnly(start.year, start.monthIndex, start.day) : null,
    endDate: end ? formatDateOnly(end.year, end.monthIndex, end.day) : null,
    serviceStartDate: start ? startOfIstDay(start) : undefined,
    serviceEndDate: end ? endOfIstDay(end) : undefined,
    granularity,
  };
}

function daysBetween(start: string, end: string) {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) {
    return 0;
  }

  return Math.max(
    1,
    Math.round(
      (Date.UTC(endDate.year, endDate.monthIndex, endDate.day) -
        Date.UTC(startDate.year, startDate.monthIndex, startDate.day)) /
        MS_PER_DAY
    ) + 1
  );
}

export function getDashboardRangeState(input: {
  searchParams: SearchParams;
  persistedRange?: string | null;
  now?: Date;
}): DashboardRangeState {
  const now = input.now ?? new Date();
  const current = getIstParts(now);
  const requestedRange = firstParam(input.searchParams.range);
  const range = isRangeValue(requestedRange)
    ? requestedRange
    : isRangeValue(input.persistedRange)
      ? input.persistedRange
      : "this-month";

  if (range === "all-time") {
    return buildRange("all-time", null, null, "All time", "month");
  }

  if (range === "custom") {
    const start = parseDateOnly(firstParam(input.searchParams.startDate));
    const end = parseDateOnly(firstParam(input.searchParams.endDate));
    if (start && end) {
      const startDate = formatDateOnly(start.year, start.monthIndex, start.day);
      const endDate = formatDateOnly(end.year, end.monthIndex, end.day);
      const dayCount = daysBetween(startDate, endDate);
      const granularity = dayCount <= 45 ? "day" : dayCount <= 184 ? "week" : "month";
      return buildRange("custom", start, end, `${startDate} to ${endDate}`, granularity);
    }
  }

  if (range === "last-month") {
    const previous = addMonths(current.year, current.monthIndex, -1);
    const start = { ...previous, day: 1 };
    const end = addDays({ year: current.year, monthIndex: current.monthIndex, day: 1 }, -1);
    return buildRange("last-month", start, end, "Last month", "day");
  }

  if (range === "last-30-days" || range === "last-90-days") {
    const days = range === "last-30-days" ? 30 : 90;
    const start = addDays(current, -(days - 1));
    return buildRange(
      range,
      start,
      current,
      range === "last-30-days" ? "Last 30 days" : "Last 90 days",
      range === "last-30-days" ? "day" : "week"
    );
  }

  if (range === "last-3-months" || range === "last-6-months") {
    const months = range === "last-3-months" ? 3 : 6;
    const startMonth = addMonths(current.year, current.monthIndex, -(months - 1));
    const start = { ...startMonth, day: 1 };
    return buildRange(
      range,
      start,
      current,
      range === "last-3-months" ? "Last 3 months" : "Last 6 months",
      "week"
    );
  }

  if (range === "this-year") {
    return buildRange(
      "this-year",
      { year: current.year, monthIndex: 0, day: 1 },
      current,
      "This year",
      "month"
    );
  }

  if (range === "last-12-months") {
    const startMonth = addMonths(current.year, current.monthIndex, -11);
    return buildRange(
      "last-12-months",
      { ...startMonth, day: 1 },
      current,
      "Last 12 months",
      "month"
    );
  }

  return buildRange(
    "this-month",
    { year: current.year, monthIndex: current.monthIndex, day: 1 },
    current,
    "This month",
    "day"
  );
}

export function getPreviousDashboardRangeState(
  range: DashboardRangeState
): DashboardComparisonRangeState | null {
  if (range.range === "all-time" || !range.startDate || !range.endDate) {
    return null;
  }

  const start = parseDateOnly(range.startDate);
  const end = parseDateOnly(range.endDate);
  if (!start || !end) {
    return null;
  }

  const dayCount = daysBetween(range.startDate, range.endDate);
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(start, -dayCount);
  const startDate = formatDateOnly(
    previousStart.year,
    previousStart.monthIndex,
    previousStart.day
  );
  const endDate = formatDateOnly(previousEnd.year, previousEnd.monthIndex, previousEnd.day);

  return {
    label: `${startDate} to ${endDate}`,
    startDate,
    endDate,
    serviceStartDate: startOfIstDay(previousStart),
    serviceEndDate: endOfIstDay(previousEnd),
  };
}

export function buildDashboardHref(input: DashboardRangeState) {
  const params = new URLSearchParams();
  params.set("range", input.range);
  if (input.range === "custom" && input.startDate && input.endDate) {
    params.set("startDate", input.startDate);
    params.set("endDate", input.endDate);
  }

  return `/dashboard?${params.toString()}`;
}
