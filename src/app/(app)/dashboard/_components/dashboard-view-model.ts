import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import type {
  DashboardCategorySpendDto,
  DashboardImportHealthDto,
  DashboardPageData,
  DashboardPeriodSpendDto,
  DashboardSummaryDto,
} from "@/server/page-data/dashboard-page-data";

const rupeeSymbol = "\u20b9";
const TOP_CATEGORY_EXCLUSIONS = new Set([
  "uncategorized",
  "transfers",
  "internal transfers",
]);

const numberFormatter = new Intl.NumberFormat("en-IN");
const fullNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});
const dashboardDayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const monthYearFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});
const dayMonthYearFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export const quickDashboardRanges: Array<{
  value: DashboardRangeValue;
  label: string;
}> = [
  { value: "last-30-days", label: "30D" },
  { value: "last-90-days", label: "90D" },
  { value: "this-year", label: "YTD" },
  { value: "last-12-months", label: "12M" },
];

export const secondaryDashboardRanges: Array<{
  value: DashboardRangeValue;
  label: string;
}> = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "last-6-months", label: "Last 6 months" },
  { value: "all-time", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export const chartLegendItems = [
  { label: "Normal", className: "bg-primary" },
  { label: "Peak", className: "bg-accent" },
  { label: "Latest", className: "bg-info" },
];

export function formatComparisonDelta(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined) {
    return "No previous data";
  }

  if (previous <= 0) {
    return current > 0 ? "New activity" : "No previous data";
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(change));
  if (rounded === 0) {
    return "Flat vs previous period";
  }

  return `${change > 0 ? "+" : "-"}${rounded}% vs previous period`;
}

export function formatPeriodLabel(period: string) {
  if (/^\d{4}$/.test(period)) {
    return { primary: period, secondary: null as string | null };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const date = new Date(`${period}T00:00:00.000Z`);
    return {
      primary: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(date),
      secondary: String(date.getUTCFullYear()),
    };
  }

  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);

    return {
      primary: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      secondary: year,
    };
  }

  return { primary: period, secondary: null as string | null };
}

export function formatPeriod(period: string) {
  const label = formatPeriodLabel(period);
  return label.secondary ? `${label.primary} ${label.secondary}` : label.primary;
}

function parseDateOnlyForDisplay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isMonthFirst(value: string) {
  return value.endsWith("-01");
}

export function formatDashboardRangeLabel(range: DashboardPageData["range"]) {
  if (range.value === "all-time" || !range.startDate || !range.endDate) {
    return range.label;
  }

  const start = parseDateOnlyForDisplay(range.startDate);
  const end = parseDateOnlyForDisplay(range.endDate);
  const formatMonthRange =
    range.granularity === "month" ||
    range.granularity === "year" ||
    (isMonthFirst(range.startDate) &&
      ["last-3-months", "last-6-months", "last-12-months", "this-year"].includes(
        range.value
      ));

  if (formatMonthRange) {
    return `${monthYearFormatter.format(start)} - ${monthYearFormatter.format(end)}`;
  }

  return `${dayMonthYearFormatter.format(start)} - ${dayMonthYearFormatter.format(end)}`;
}

export function getPeriodLabelStep(periodCount: number) {
  if (periodCount > 24) {
    return 5;
  }

  if (periodCount > 18) {
    return 4;
  }

  if (periodCount > 10) {
    return 3;
  }

  if (periodCount > 6) {
    return 2;
  }

  return 1;
}

export function getPeakPeriod(periods: DashboardPeriodSpendDto[]) {
  return periods.reduce<DashboardPeriodSpendDto | null>((peak, current) => {
    if (!peak || current.totalSpend > peak.totalSpend) {
      return current;
    }

    return peak;
  }, null);
}

export function getAveragePeriodSpend(periods: DashboardPeriodSpendDto[]) {
  if (periods.length === 0) {
    return 0;
  }

  const total = periods.reduce((sum, period) => sum + period.totalSpend, 0);
  return total / periods.length;
}

function getNiceStep(targetStep: number) {
  if (targetStep <= 0) {
    return 0;
  }

  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalized = targetStep / magnitude;

  if (normalized <= 1) {
    return magnitude;
  }

  if (normalized <= 2) {
    return 2 * magnitude;
  }

  if (normalized <= 2.5) {
    return 2.5 * magnitude;
  }

  if (normalized <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

export function buildChartTicks(maxValue: number) {
  if (maxValue <= 0) {
    return [];
  }

  const step = getNiceStep(maxValue / 3);
  const topValue = step * 3;
  return [0, step, step * 2, topValue].map((value) => ({
    ratio: topValue === 0 ? 0 : value / topValue,
    value,
  }));
}

export function getCategoryShare(itemTotal: number, totalSpend: number) {
  if (totalSpend <= 0) {
    return 0;
  }

  return Math.round((itemTotal / totalSpend) * 100);
}

function isEligibleTopCategory(category: string) {
  return !TOP_CATEGORY_EXCLUSIONS.has(category.trim().toLowerCase());
}

export function getTopCategoryInsight(
  categories: DashboardCategorySpendDto[],
  totalSpend: number
) {
  const topCategory = categories.find((category) => isEligibleTopCategory(category.category));
  if (!topCategory) {
    return null;
  }

  return {
    ...topCategory,
    share: getCategoryShare(topCategory.totalSpend, totalSpend),
  };
}

export function formatCurrency(value: number) {
  return `${value < 0 ? "-" : ""}${rupeeSymbol}${fullNumberFormatter.format(
    Math.abs(value)
  )}`;
}

export function formatCompactCurrency(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 100000) {
    return `${sign}${rupeeSymbol}${trimTrailingZeros(absolute / 100000, 2)}L`;
  }

  if (absolute >= 1000) {
    return `${sign}${rupeeSymbol}${trimTrailingZeros(absolute / 1000, 1)}K`;
  }

  return `${sign}${rupeeSymbol}${fullNumberFormatter.format(absolute)}`;
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getDashboardDayKey(value: Date) {
  return dashboardDayKeyFormatter.format(value);
}

export function buildRecentTransactionMeta(
  category: string | null,
  timestamp: string,
  options: { now?: Date } = {}
) {
  const date = new Date(timestamp);
  const now = options.now ?? new Date();
  const isSameDay = getDashboardDayKey(date) === getDashboardDayKey(now);

  return {
    timestampLabel: isSameDay ? timeFormatter.format(date) : shortDateFormatter.format(date),
    isSameDay,
    categoryLabel: category ?? "No category",
    needsCategory: !category,
  };
}

export function buildRecentTransactionsSummary(input: {
  transactionCount: number;
  uncategorizedCount: number;
}) {
  const recentLabel = `${formatNumber(input.transactionCount)} recent`;
  const reviewLabel =
    input.uncategorizedCount > 0
      ? `${formatNumber(input.uncategorizedCount)} need category`
      : "All categorized";

  return `${recentLabel} \u00b7 ${reviewLabel}`;
}

function trimTrailingZeros(value: number, fractionDigits: number) {
  return value
    .toFixed(fractionDigits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

type LinkParamValue = string | number | null | undefined;

function setParam(params: URLSearchParams, key: string, value: LinkParamValue) {
  if (value !== null && value !== undefined && value !== "") {
    params.set(key, String(value));
  }
}

export function getRangeParams(range: DashboardPageData["range"]) {
  return {
    startDate: range.startDate,
    endDate: range.endDate,
  };
}

export function buildTransactionsHref(params: Record<string, LinkParamValue>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    setParam(searchParams, key, value);
  }

  const query = searchParams.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildReviewQueueHref(range: DashboardPageData["range"]) {
  return buildTransactionsHref({
    ...getRangeParams(range),
    review: "queue",
  });
}

export function buildImportsReviewHref(range: DashboardPageData["range"]) {
  const searchParams = new URLSearchParams();
  setParam(searchParams, "startDate", range.startDate);
  setParam(searchParams, "endDate", range.endDate);
  const query = searchParams.toString();
  return query ? `/imports/review?${query}` : "/imports/review";
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthEnd(period: string) {
  const [year, month] = period.split("-").map(Number);
  return formatDateOnly(new Date(Date.UTC(year, month, 0)));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getPeriodBounds(
  period: string,
  granularity: DashboardPageData["range"]["granularity"]
) {
  if (granularity === "day") {
    return { startDate: period, endDate: period };
  }

  if (granularity === "week") {
    const start = parseDateOnly(period);
    return {
      startDate: period,
      endDate: formatDateOnly(addDays(start, 6)),
    };
  }

  if (granularity === "year") {
    return { startDate: `${period}-01-01`, endDate: `${period}-12-31` };
  }

  return { startDate: `${period}-01`, endDate: getMonthEnd(period) };
}

export function buildPeriodTransactionsHref(
  period: string,
  granularity: DashboardPageData["range"]["granularity"]
) {
  return buildTransactionsHref(getPeriodBounds(period, granularity));
}

export function buildReviewQueueCard(input: {
  summary: DashboardSummaryDto;
  importHealth: DashboardImportHealthDto;
  largeTransactionCount: number;
  range: DashboardPageData["range"];
}) {
  const importIssueCount =
    input.importHealth.failedCount + input.importHealth.unparseableCount;
  const totalReviewCount =
    input.summary.uncategorizedCount + importIssueCount + input.largeTransactionCount;
  const hasItems =
    input.summary.uncategorizedCount > 0 ||
    importIssueCount > 0 ||
    input.largeTransactionCount > 0;
  const badges = [
    {
      label: "Needs category",
      count: input.summary.uncategorizedCount,
      tone: "attention" as const,
    },
    {
      label: "Import issues",
      count: importIssueCount,
      tone: "warning" as const,
    },
    {
      label: "Large spends",
      count: input.largeTransactionCount,
      tone: "info" as const,
    },
  ];

  return {
    title: "Review queue",
    href: buildReviewQueueHref(input.range),
    action: hasItems ? "Review" : "View transactions",
    hasItems,
    totalReviewCount,
    badges,
    lines: hasItems
      ? [
          `${formatNumber(input.summary.uncategorizedCount)} need category`,
          `${formatNumber(importIssueCount)} imports need review`,
          input.largeTransactionCount > 0
            ? `${formatNumber(input.largeTransactionCount)} large spends over ${formatCurrency(
                LARGE_TRANSACTION_THRESHOLD
              )}`
            : `No large spends`,
        ]
      : ["All caught up", "No items need review"],
    helper:
      hasItems || input.largeTransactionCount > 0
        ? null
        : `Nothing over ${formatCurrency(LARGE_TRANSACTION_THRESHOLD)} in this period.`,
    thresholdLabel: formatCurrency(LARGE_TRANSACTION_THRESHOLD),
  };
}

export function buildMetricComparisons(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  categories: DashboardCategorySpendDto[];
}) {
  const topCategory = getTopCategoryInsight(input.categories, input.summary.totalSpend);
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        input.comparison.summary.totalSpend
      )
    : null;

  return {
    totalSpend: formatComparisonDelta(
      input.summary.totalSpend,
      input.comparison?.summary.totalSpend
    ),
    averageSpend: formatComparisonDelta(
      input.summary.averageSpend,
      input.comparison?.summary.averageSpend
    ),
    biggestCategory: topCategory
      ? previousTopCategory
        ? previousTopCategory.category === topCategory.category
          ? "Stable vs previous period"
          : `${previousTopCategory.category} to ${topCategory.category}`
        : "No previous data"
      : "No category signal",
  };
}

export function buildDashboardInsights(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  periods: DashboardPeriodSpendDto[];
  categories: DashboardCategorySpendDto[];
  importHealth: DashboardImportHealthDto;
  largeTransactionCount: number;
}) {
  const averagePeriodSpend = getAveragePeriodSpend(input.periods);
  const latestPeriod = input.periods[input.periods.length - 1] ?? null;
  const peakPeriod = getPeakPeriod(input.periods);
  const topCategory = getTopCategoryInsight(input.categories, input.summary.totalSpend);
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        input.comparison.summary.totalSpend
      )
    : null;
  const importIssueCount =
    input.importHealth.failedCount + input.importHealth.unparseableCount;
  const reviewCount =
    input.summary.uncategorizedCount + importIssueCount + input.largeTransactionCount;

  return [
    {
      label: "Trend",
      value: input.comparison
        ? formatComparisonDelta(
            input.summary.totalSpend,
            input.comparison.summary.totalSpend
          )
        : latestPeriod && averagePeriodSpend > 0
          ? `${formatCompactCurrency(latestPeriod.totalSpend)} latest vs ${formatCompactCurrency(
              averagePeriodSpend
            )} average`
          : "No trend yet",
      helper: input.comparison
        ? `Compared with ${input.comparison.rangeLabel}`
        : "Add more history for comparisons",
    },
    {
      label: "Spike",
      value: peakPeriod
        ? `${formatPeriod(peakPeriod.period)} at ${formatCompactCurrency(peakPeriod.totalSpend)}`
        : "No spike yet",
      helper: peakPeriod
        ? `${formatNumber(peakPeriod.transactionCount)} transactions in the peak bucket`
        : "No spending buckets in this range",
    },
    {
      label: "Category shift",
      value: topCategory
        ? previousTopCategory && previousTopCategory.category !== topCategory.category
          ? `${previousTopCategory.category} to ${topCategory.category}`
          : `${topCategory.category} leads`
        : "No category signal",
      helper: topCategory
        ? `${topCategory.share}% of selected spending`
        : "Categorize spending to unlock category insights",
    },
    {
      label: "Review pressure",
      value: reviewCount > 0 ? `${formatNumber(reviewCount)} items need review` : "All clear",
      helper:
        reviewCount > 0
          ? `${formatNumber(input.summary.uncategorizedCount)} uncategorized, ${formatNumber(
              importIssueCount
            )} import issues`
          : "No uncategorized, import, or large-spend review items",
    },
  ];
}
