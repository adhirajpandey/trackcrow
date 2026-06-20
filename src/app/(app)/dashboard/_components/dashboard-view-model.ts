import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
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
  const hasItems =
    input.summary.uncategorizedCount > 0 ||
    importIssueCount > 0 ||
    input.largeTransactionCount > 0;

  return {
    title: "Review queue",
    href: buildReviewQueueHref(input.range),
    action: hasItems ? "Review" : "View transactions",
    hasItems,
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
