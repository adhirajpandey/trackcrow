import type { DashboardDayActivity, SpendingPageBase } from "@/server/page-data/dashboard-page-data";

type DashboardPageData = Pick<SpendingPageBase, "range" | "comparison">;

const rupeeSymbol = "₹";
export const DASHBOARD_TIME_ZONE = "Asia/Kolkata";

const numberFormatter = new Intl.NumberFormat("en-IN");
const fullNumberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/* ---------- numbers ---------- */

export function formatCurrency(value: number) {
  return `${value < 0 ? "-" : ""}${rupeeSymbol}${fullNumberFormatter.format(Math.abs(value))}`;
}

/** ₹480, ₹2.5K, ₹42K, ₹1.6L, ₹1.2Cr: one decimal below ten of a unit, so ₹2.5K never reads as ₹3K. */
export function formatCompactCurrency(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const scaled = (divisor: number, suffix: string) => {
    const amount = absolute / divisor;
    const digits = amount < 10 ? 1 : 0;
    return `${sign}${rupeeSymbol}${amount.toLocaleString("en-IN", { maximumFractionDigits: digits })}${suffix}`;
  };
  if (absolute >= 10000000) return scaled(10000000, "Cr");
  if (absolute >= 100000) return scaled(100000, "L");
  if (absolute >= 1000) return scaled(1000, "K");
  return `${sign}${rupeeSymbol}${fullNumberFormatter.format(absolute)}`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function pluralize(count: number, one: string, many = `${one}s`) {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

/** Whole-number percentage; "<1" when the value is real but rounds to zero. */
export function formatShare(value: number, of: number) {
  if (!of) return "0";
  const rounded = Math.round((value / of) * 100);
  return value > 0 && rounded === 0 ? "<1" : String(rounded);
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/* ---------- dates (all in IST) ---------- */

const istDayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: DASHBOARD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const istTimeFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: DASHBOARD_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });

/** "2026-10-02" for a timestamp, in IST. */
export function toIstDay(timestamp: string) {
  return istDayFormatter.format(new Date(timestamp));
}

/** "18:49" for a timestamp, in IST, 24-hour like the Transactions table. */
export function formatIstTime(timestamp: string) {
  return istTimeFormatter.format(new Date(timestamp));
}

/** "06 Nov 2026" for a timestamp, in IST. */
export function formatShortDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: DASHBOARD_TIME_ZONE, day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp));
}

const dayFormat = (day: string, options: Intl.DateTimeFormatOptions, locale = "en-IN") =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export const formatDayShort = (day: string) => dayFormat(day, { day: "numeric", month: "short" });
export const formatDayFull = (day: string) => dayFormat(day, { day: "numeric", month: "short", year: "numeric" });
export const formatWeekday = (day: string) => dayFormat(day, { weekday: "long" });
export const formatMonthName = (day: string) => dayFormat(day, { month: "long" });
export const formatMonthShort = (day: string) => dayFormat(day, { month: "short" }, "en-US");
export const formatMonthInitial = (day: string) => dayFormat(day, { month: "narrow" }, "en-US");

export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function addMonths(day: string, amount: number) {
  const date = new Date(`${day}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)).toISOString().slice(0, 10);
}

export const formatMonthYear = (day: string) => dayFormat(day, { month: "short", year: "numeric" });

export function daysBetween(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

/** Monday is 0. */
export function dayOfWeek(day: string) {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function monthEnd(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
}

/** "Oct 1–31, 2026", "Aug 9 – Nov 6, 2026", "Nov 7, 2025 – Nov 6, 2026". */
export function formatCompactDateRange(start: string, end: string) {
  const startYear = start.slice(0, 4);
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return start === end
      ? `${dayFormat(start, { month: "short", day: "numeric" }, "en-US")}, ${startYear}`
      : `${formatMonthShort(start)} ${Number(start.slice(8))}–${Number(end.slice(8))}, ${startYear}`;
  }
  if (startYear === end.slice(0, 4)) {
    return `${dayFormat(start, { month: "short", day: "numeric" }, "en-US")} – ${dayFormat(end, { month: "short", day: "numeric" }, "en-US")}, ${startYear}`;
  }
  return `${dayFormat(start, { month: "short", day: "numeric", year: "numeric" }, "en-US")} – ${dayFormat(end, { month: "short", day: "numeric", year: "numeric" }, "en-US")}`;
}

/* ---------- the calendar ---------- */

export const SPEND_TIERS = [
  { max: 300, className: "bg-card", label: "Under ₹300" },
  { max: 1000, className: "bg-[var(--paper-mint)]", label: "₹300–1K" },
  { max: 3000, className: "bg-[#bdeed3]", label: "₹1K–3K" },
  { max: 10000, className: "bg-primary", label: "₹3K–10K" },
  { max: Infinity, className: "bg-[#171714]", label: "₹10K+" },
] as const;

export function getSpendTier(total: number) {
  return SPEND_TIERS.findIndex((tier) => total < tier.max);
}

export type CalendarDay = {
  day: string;
  total: number;
  count: number;
  uncategorizedCount: number;
  future: boolean;
};

export type CalendarRange = {
  /** First day shown. */
  start: string;
  /** Last day with data, never after today. */
  end: string;
  /** Last day shown; this month keeps its days still to come. */
  gridEnd: string;
  layout: "month" | "year";
};

/** Ranges longer than about three months switch from week rows to a year grid. */
export const MONTH_LAYOUT_MAX_DAYS = 100;

export function getCalendarRange(range: DashboardPageData["range"], today: string, days: DashboardDayActivity[]): CalendarRange {
  const start = range.startDate ?? days[0]?.day ?? today;
  const rawEnd = range.endDate ?? today;
  const end = rawEnd > today ? today : rawEnd < start ? start : rawEnd;
  const gridEnd = range.value === "this-month" ? monthEnd(start) : end;
  return { start, end, gridEnd, layout: daysBetween(start, gridEnd) + 1 > MONTH_LAYOUT_MAX_DAYS ? "year" : "month" };
}

export function buildCalendarDays(calendar: CalendarRange, activity: DashboardDayActivity[]): CalendarDay[] {
  const byDay = new Map(activity.map((entry) => [entry.day, entry]));
  const out: CalendarDay[] = [];
  for (let day = calendar.start; day <= calendar.gridEnd; day = addDays(day, 1)) {
    const entry = byDay.get(day);
    out.push({
      day,
      total: entry?.totalSpend ?? 0,
      count: entry?.transactionCount ?? 0,
      uncategorizedCount: entry?.uncategorizedCount ?? 0,
      future: day > calendar.end,
    });
  }
  return out;
}

/** Monday-to-Sunday weeks covering start..end; days outside are still listed so rows stay aligned. */
export function buildWeeks(start: string, end: string) {
  const weeks: string[][] = [];
  for (let monday = addDays(start, -dayOfWeek(start)); monday <= end; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(monday, index)));
  }
  return weeks;
}

/** "September", "the same days last month", "the previous 30 days", "the same period last year". */
export function getComparisonLabel(comparison: NonNullable<DashboardPageData["comparison"]>, calendar: CalendarRange) {
  switch (comparison.kind) {
    case "previous-calendar-month":
      return formatMonthName(comparison.startDate);
    case "previous-month-to-date":
      return "the same days last month";
    case "same-period-last-year":
      return "the same period last year";
    default:
      return `the previous ${pluralize(daysBetween(calendar.start, calendar.end) + 1, "day")}`;
  }
}

/** Name used in "27% of October’s total". */
export function getRangeName(range: DashboardPageData["range"], calendar: CalendarRange) {
  if (range.value === "last-month") return formatMonthName(calendar.start);
  if (range.value === "this-month") return "this month";
  if (range.value === "custom") return "this range";
  return range.label.toLowerCase();
}

/** Compact name for tight spots, such as "10% of Oct". */
export function getRangeShortName(range: DashboardPageData["range"], calendar: CalendarRange) {
  if (range.value === "last-month") return formatMonthShort(calendar.start);
  if (range.value === "this-month") return "this month";
  if (range.value === "custom") return "range";
  return range.label.replace(/^Last /, "").toLowerCase();
}

/* ---------- links ---------- */

type LinkParamValue = string | number | null | undefined;

export function buildTransactionsHref(params: Record<string, LinkParamValue>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildUncategorizedTransactionsHref(calendar: CalendarRange) {
  return buildTransactionsHref({ startDate: calendar.start, endDate: calendar.end, status: "uncategorized" });
}

export function formatDashboardRangeLabel(range: DashboardPageData["range"], calendar: CalendarRange) {
  if (range.value === "all-time") return `All time · ${formatCompactDateRange(calendar.start, calendar.end)}`;
  return `${range.label} · ${formatCompactDateRange(calendar.start, calendar.end)}`;
}
