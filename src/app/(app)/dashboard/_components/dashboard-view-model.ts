import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import type {
  DashboardCategorySpendDto,
  DashboardPageData,
  DashboardPeriodSpendDto,
  DashboardSectionStatus,
  DashboardSummaryDto,
} from "@/server/page-data/dashboard-page-data";

const rupeeSymbol = "\u20b9";
const TOP_CATEGORY_EXCLUSIONS = new Set([
  "uncategorized",
  "transfers",
  "internal transfer",
  "internal transfers",
  "refund",
  "refunds",
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
const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export type DashboardInsightVm = {
  label: string;
  value: string;
  helper: string;
  href: string | null;
  tone: "neutral" | "attention" | "info";
};

export type DashboardRightRailCardVm = {
  label: string;
  value: string;
  helper: string;
  href: string | null;
  tone: "neutral" | "attention" | "info";
};

export type DashboardSuggestedRuleVm = {
  recipient: string;
  action: string;
  href: string;
  paymentCount: number;
  totalAmount: number;
};

export type DashboardRecipientInsightVm = {
  recipient: string;
  paymentCount: number;
  totalAmount: number;
  action: "Create rule" | "Review";
  href: string;
  helper: string;
};

export type DashboardChangeSummaryVm = {
  title: string;
  value: string;
  helper: string;
  tone: DashboardComparisonTone;
};

type DashboardChangeSummarySignal = {
  isSpikeDriven: boolean;
  peakPeriod: DashboardPeriodSpendDto | null;
  latestPeriod: DashboardPeriodSpendDto | null;
  averagePeriodSpend: number;
};

export type DashboardChartTooltipVm = {
  title: string;
  amountLabel: string;
  transactionLabel: string;
};

export type DashboardChartDisplayPeriodVm = DashboardPeriodSpendDto & {
  isFuture: boolean;
  isPlaceholder: boolean;
};

export type DashboardChartBucketVm = {
  period: string;
  href: string | null;
  height: number;
  isPeak: boolean;
  isLatest: boolean;
  isFuture: boolean;
  isPlaceholder: boolean;
  label: ReturnType<typeof formatPeriodLabel>;
  showLabel: boolean;
  tooltip: DashboardChartTooltipVm;
  ariaLabel: string;
};

export const chartLegendItems = [
  { label: "Normal", className: "bg-primary" },
  { label: "Peak", className: "bg-accent" },
  { label: "Latest", className: "bg-info" },
];

export type DashboardComparisonTone = "increase" | "decrease" | "neutral";

export type DashboardComparisonPresentation = {
  title: string;
  value: string;
  full: string;
  tone: DashboardComparisonTone;
};

function formatComparisonPercentage(change: number) {
  const absolute = Math.abs(change);
  return absolute < 10 ? absolute.toFixed(1) : String(Math.round(absolute));
}

export function formatComparisonRangeLabel(input: {
  startDate?: string;
  endDate?: string;
  rangeLabel?: string;
}) {
  const [fallbackStart, fallbackEnd] = input.rangeLabel?.split(" to ") ?? [];
  const startDate = input.startDate ?? fallbackStart;
  const endDate = input.endDate ?? fallbackEnd;

  if (!startDate || !endDate) {
    return input.rangeLabel ?? "comparison period";
  }

  return formatCompactDateRange(startDate, endDate);
}

export function getComparisonContextLabel(
  comparison: DashboardPageData["comparison"]
) {
  if (!comparison) {
    return "comparison period";
  }

  if (comparison.kind === "same-period-last-year") {
    return "same period last year";
  }

  if (comparison.kind === "previous-month-to-date") {
    return "same point last month";
  }

  if (comparison.kind === "previous-calendar-month") {
    return "the previous month";
  }

  return formatComparisonRangeLabel(comparison);
}

export function buildComparisonPresentation(
  current: number,
  comparison: DashboardPageData["comparison"]
): DashboardComparisonPresentation {
  if (!comparison) {
    return {
      title: "Comparison",
      value: "Not available",
      full: "No comparison available",
      tone: "neutral",
    };
  }

  const previous = comparison.summary.totalSpend;
  const rangeLabel = formatComparisonRangeLabel(comparison);
  const contextLabel = getComparisonContextLabel(comparison);
  const title = `Vs ${contextLabel}`;

  if (previous <= 0) {
    if (current > 0) {
      return {
        title,
        value: "New spending",
        full: `New spending vs ${rangeLabel}`,
        tone: "increase",
      };
    }

    return {
      title,
      value: "No spending",
      full: "No spending in either period",
      tone: "neutral",
    };
  }

  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) {
    return {
      title,
      value: "About the same",
      full: `About the same as ${rangeLabel}`,
      tone: "neutral",
    };
  }

  const percentage = formatComparisonPercentage(change);
  const direction = change > 0 ? "higher" : "lower";

  return {
    title,
    value: `${percentage}% ${direction}`,
    full: `${percentage}% ${direction} than ${contextLabel}`,
    tone: change > 0 ? "increase" : "decrease",
  };
}

export function formatComparisonDelta(
  current: number,
  previous: number | null | undefined,
  comparison?: DashboardPageData["comparison"]
) {
  if (comparison) {
    return buildComparisonPresentation(current, comparison).full;
  }

  if (previous === null || previous === undefined) {
    return "No comparison available";
  }

  if (previous <= 0) {
    return current > 0 ? "New spending" : "No spending in either period";
  }

  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) {
    return "About the same";
  }

  return `${formatComparisonPercentage(change)}% ${change > 0 ? "higher" : "lower"}`;
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

function formatCompactDateRange(startDate: string, endDate: string) {
  const start = parseDateOnlyForDisplay(startDate);
  const end = parseDateOnlyForDisplay(endDate);
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  ) {
    const monthFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    if (start.getUTCDate() === end.getUTCDate()) {
      return `${monthDayFormatter.format(start)}, ${end.getUTCFullYear()}`;
    }

    return `${monthFormatter.format(start)} ${start.getUTCDate()}–${end.getUTCDate()}, ${end.getUTCFullYear()}`;
  }

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${monthDayFormatter.format(start)}–${monthDayFormatter.format(end)}, ${end.getUTCFullYear()}`;
  }

  return `${monthDayYearFormatter.format(start)}–${monthDayYearFormatter.format(end)}`;
}

export function formatDashboardDateRange(range: DashboardPageData["range"]) {
  if (range.value === "all-time" || !range.startDate || !range.endDate) {
    return range.label;
  }

  return formatCompactDateRange(range.startDate, range.endDate);
}

export function formatDashboardRangeLabel(range: DashboardPageData["range"]) {
  if (range.value === "all-time" || !range.startDate || !range.endDate) {
    return "All time";
  }

  const resultLabels: Record<DashboardRangeValue, string> = {
    "this-month": "This month",
    "last-30-days": "Last 30 days",
    "last-90-days": "Last 90 days",
    "last-month": "Last month",
    "last-3-months": "Last 3 months",
    "last-6-months": "Last 6 months",
    "this-year": "Year to date",
    "last-12-months": "Last 12 months",
    "all-time": "All time",
    custom: "Custom range",
  };

  return `${resultLabels[range.value]} · ${formatDashboardDateRange(range)}`;
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

  const tickIntervals = [3, 4, 5];
  const { step, intervalCount } = tickIntervals
    .map((intervalCount) => {
      const step = getNiceStep(maxValue / intervalCount);
      return {
        intervalCount,
        step,
        topValue: step * intervalCount,
      };
    })
    .reduce((best, candidate) =>
      candidate.topValue < best.topValue ? candidate : best
    );
  const topValue = step * intervalCount;

  return Array.from({ length: intervalCount + 1 }, (_, index) => step * index).map((value) => ({
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

export function getKnownSpendingCategories(categories: DashboardCategorySpendDto[]) {
  return categories.filter((category) => isEligibleTopCategory(category.category));
}

export function getKnownSpendTotal(categories: DashboardCategorySpendDto[]) {
  return getKnownSpendingCategories(categories).reduce(
    (sum, category) => sum + category.totalSpend,
    0
  );
}

export function getTopCategoryInsight(
  categories: DashboardCategorySpendDto[],
  categorizedSpendTotal: number
) {
  const topCategory = getKnownSpendingCategories(categories)[0];
  if (!topCategory) {
    return null;
  }

  return {
    ...topCategory,
    share: getCategoryShare(topCategory.totalSpend, categorizedSpendTotal),
  };
}

function isLowConfidenceRecipientLabel(label: string) {
  return /^unknown (recipient|payee|merchant)$/i.test(label) || /^upi:/i.test(label);
}

function getRecipientReviewAction(input: {
  recipient: string;
  paymentCount: number;
  totalAmount: number;
}) {
  if (
    input.paymentCount >= 2 &&
    !isLowConfidenceRecipientLabel(input.recipient) &&
    input.totalAmount < LARGE_TRANSACTION_THRESHOLD
  ) {
    return "Create rule" as const;
  }

  return "Review" as const;
}

function getRecipientActionHref(
  recipientUuid: string | null,
  action: "Create rule" | "Review"
) {
  if (action === "Create rule") {
    const params = new URLSearchParams({ create: "1" });
    if (recipientUuid) params.set("recipient", recipientUuid);
    return `/rules?${params}`;
  }

  return recipientUuid ? `/recipients/${recipientUuid}` : "/recipients";
}

export function formatCurrency(value: number) {
  return `${value < 0 ? "-" : ""}${rupeeSymbol}${fullNumberFormatter.format(
    Math.abs(value)
  )}`;
}

export function formatCompactCurrency(
  value: number,
  options: {
    style?: "kpi" | "chart" | "summary";
  } = {}
) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const style = options.style ?? "summary";
  const fractionDigits = style === "kpi" ? 1 : 0;

  if (absolute >= 10000000) {
    return `${sign}${rupeeSymbol}${formatCompactNumber(
      absolute / 10000000,
      fractionDigits
    )}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}${rupeeSymbol}${formatCompactNumber(
      absolute / 100000,
      fractionDigits
    )}L`;
  }

  if (absolute >= 1000) {
    const thousandsFractionDigits =
      style === "chart" ? 0 : absolute >= 10000 ? 0 : fractionDigits;
    return `${sign}${rupeeSymbol}${formatCompactNumber(
      absolute / 1000,
      thousandsFractionDigits
    )}K`;
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
  const dateLabel = formatShortDate(timestamp);
  const timeLabel = timeFormatter.format(date);

  return {
    timestampLabel: `${dateLabel} ${timeLabel}`,
    dateLabel,
    timeLabel,
    isSameDay,
    categoryLabel: category ?? "Uncategorized",
    needsCategory: !category,
  };
}

export function buildRecentTransactionsSummary(input: {
  transactionCount: number;
}) {
  return `${formatNumber(input.transactionCount)} recent`;
}

function formatCompactNumber(value: number, fractionDigits: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
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

export function buildLargeTransactionsHref(range: DashboardPageData["range"]) {
  return buildTransactionsHref({
    range: range.value,
    startDate: range.value === "custom" ? range.startDate : null,
    endDate: range.value === "custom" ? range.endDate : null,
    review: "large",
    sortBy: "amount",
    sortOrder: "desc",
  });
}

export function buildUncategorizedTransactionsHref(range: DashboardPageData["range"]) {
  return buildTransactionsHref({
    ...getRangeParams(range),
    status: "uncategorized",
  });
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthEndDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
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
  return buildTransactionsHref({
    range: "custom",
    ...getPeriodBounds(period, granularity),
  });
}

export function buildChartDisplayPeriods(input: {
  range: DashboardPageData["range"];
  periods: DashboardPeriodSpendDto[];
}): DashboardChartDisplayPeriodVm[] {
  if (
    input.range.granularity !== "day" ||
    !input.range.startDate ||
    !input.range.endDate
  ) {
    return input.periods.map((period) => ({
      ...period,
      isFuture: false,
      isPlaceholder: false,
    }));
  }

  const start = parseDateOnly(input.range.startDate);
  const end = parseDateOnly(input.range.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return input.periods.map((period) => ({
      ...period,
      isFuture: false,
      isPlaceholder: false,
    }));
  }

  const displayEnd =
    input.range.value === "this-month" ? getMonthEndDate(start) : end;
  const periodsByKey = new Map(input.periods.map((period) => [period.period, period]));
  const displayPeriods: DashboardChartDisplayPeriodVm[] = [];

  for (
    let current = new Date(start);
    current <= displayEnd;
    current = addDays(current, 1)
  ) {
    const key = formatDateOnly(current);
    const existing = periodsByKey.get(key);
    const isFuture = current > end;

    displayPeriods.push({
      period: key,
      totalSpend: existing?.totalSpend ?? 0,
      transactionCount: existing?.transactionCount ?? 0,
      isFuture,
      isPlaceholder: !existing,
    });
  }

  return displayPeriods;
}

export function buildMetricComparisons(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  categories: DashboardCategorySpendDto[];
}) {
  const topCategory = getTopCategoryInsight(
    input.categories,
    getKnownSpendTotal(input.categories)
  );
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        getKnownSpendTotal(input.comparison.spendingByCategory)
      )
    : null;

  return {
    totalSpend: buildComparisonPresentation(input.summary.totalSpend, input.comparison).full,
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

export function buildWhatChangedSummary(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  periods: DashboardPeriodSpendDto[];
}) : DashboardChangeSummaryVm {
  if (!input.comparison) {
    return {
      title: "Comparison",
      value: "Not available",
      helper: "Add more history to compare this range.",
      tone: "neutral",
    };
  }

  const comparisonPresentation = buildComparisonPresentation(
    input.summary.totalSpend,
    input.comparison
  );
  const previousTotalSpend = input.comparison.summary.totalSpend;
  const amountDelta = input.summary.totalSpend - input.comparison.summary.totalSpend;
  const summarySignal = getChangeSummarySignal(input.periods);

  if (previousTotalSpend <= 0) {
    return {
      title: comparisonPresentation.title,
      value: comparisonPresentation.value,
      helper:
        input.summary.totalSpend > 0
          ? `New spending activity compared with ${formatComparisonRangeLabel(input.comparison)}.`
          : "No spending activity in either period.",
      tone: comparisonPresentation.tone,
    };
  }

  if (comparisonPresentation.tone === "neutral") {
    return {
      title: comparisonPresentation.title,
      value: comparisonPresentation.value,
      helper: `${comparisonPresentation.full}.`,
      tone: "neutral",
    };
  }

  if (amountDelta > 0 && summarySignal.isSpikeDriven) {
    const averageLabel =
      summarySignal.averagePeriodSpend > 0
        ? formatCompactCurrency(summarySignal.averagePeriodSpend, { style: "chart" })
        : null;
    const latestLabel = summarySignal.latestPeriod
      ? formatCompactCurrency(summarySignal.latestPeriod.totalSpend, { style: "chart" })
      : null;
    const peakDateLabel = summarySignal.peakPeriod
      ? formatPeriod(summarySignal.peakPeriod.period)
      : null;

    return {
      title: comparisonPresentation.title,
      value: "Up, driven by one spike",
      helper:
        latestLabel && averageLabel && peakDateLabel
          ? `${comparisonPresentation.value} overall. Most of the lift came from ${peakDateLabel}; latest closed at ${latestLabel} vs ${averageLabel} average.`
          : `${comparisonPresentation.value} overall, but the increase was concentrated in one bucket compared with ${formatComparisonRangeLabel(input.comparison)}.`,
      tone: comparisonPresentation.tone,
    };
  }

  return {
    title: comparisonPresentation.title,
    value: comparisonPresentation.value,
    helper: `${amountDelta > 0 ? "Up by" : "Down by"} ${formatCurrency(
      Math.abs(amountDelta)
    )} compared with ${formatComparisonRangeLabel(input.comparison)}.`,
    tone: comparisonPresentation.tone,
  };
}

function getChangeSummarySignal(
  periods: DashboardPeriodSpendDto[]
): DashboardChangeSummarySignal {
  const peakPeriod = getPeakPeriod(periods);
  const latestPeriod = periods[periods.length - 1] ?? null;
  const averagePeriodSpend = getAveragePeriodSpend(periods);

  if (!peakPeriod || !latestPeriod || averagePeriodSpend <= 0 || periods.length < 3) {
    return {
      isSpikeDriven: false,
      peakPeriod,
      latestPeriod,
      averagePeriodSpend,
    };
  }

  const isSpikeDriven =
    peakPeriod.totalSpend >= averagePeriodSpend * 2.5 &&
    latestPeriod.totalSpend <= averagePeriodSpend * 0.75 &&
    latestPeriod.totalSpend <= peakPeriod.totalSpend * 0.4;

  return {
    isSpikeDriven,
    peakPeriod,
    latestPeriod,
    averagePeriodSpend,
  };
}

export function buildChartTooltip(input: {
  period: DashboardPeriodSpendDto;
}): DashboardChartTooltipVm {
  return {
    title: formatPeriod(input.period.period),
    amountLabel: formatCurrency(input.period.totalSpend),
    transactionLabel: `${formatNumber(input.period.transactionCount)} transactions`,
  };
}

export function buildChartBuckets(input: {
  periods: DashboardChartDisplayPeriodVm[];
  peakPeriod: DashboardPeriodSpendDto | null;
  latestPeriod: DashboardPeriodSpendDto | null;
  chartMax: number;
  periodLabelStep: number;
  granularity: DashboardPageData["range"]["granularity"];
}): DashboardChartBucketVm[] {
  return input.periods.map((item, index) => {
    const label = formatPeriodLabel(item.period);
    const isPeak = input.peakPeriod?.period === item.period;
    const isLatest = input.latestPeriod?.period === item.period;
    const lastIndex = input.periods.length - 1;
    const isEndpoint = index === 0 || index === lastIndex;
    const hasRoomBeforeFinalLabel = lastIndex - index >= input.periodLabelStep;
    const showLabel =
      isEndpoint ||
      (index % input.periodLabelStep === 0 && hasRoomBeforeFinalLabel);

    const tooltip = buildChartTooltip({
      period: item,
    });

    return {
      period: item.period,
      href: item.isFuture
        ? null
        : buildPeriodTransactionsHref(item.period, input.granularity),
      height: input.chartMax > 0 ? (item.totalSpend / input.chartMax) * 100 : 0,
      isPeak,
      isLatest,
      isFuture: item.isFuture,
      isPlaceholder: item.isPlaceholder,
      label,
      showLabel,
      tooltip,
      ariaLabel: `${tooltip.title}: ${tooltip.amountLabel}, ${tooltip.transactionLabel}`,
    };
  });
}

export function buildDashboardInsights(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  categories: DashboardCategorySpendDto[];
  importIssueCount: number;
  range: DashboardPageData["range"];
  sectionStatus: DashboardSectionStatus;
}) : DashboardInsightVm[] {
  const topCategory = getTopCategoryInsight(
    input.categories,
    getKnownSpendTotal(input.categories)
  );
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        getKnownSpendTotal(input.comparison.spendingByCategory)
      )
    : null;

  const insights: DashboardInsightVm[] = [];

  if (input.summary.uncategorizedCount > 0) {
    const uncategorizedLabel =
      input.summary.uncategorizedCount === 1
        ? "1 transaction still needs a category"
        : `${formatNumber(input.summary.uncategorizedCount)} transactions still need a category`;

    insights.push({
      label: "Uncategorized",
      value: uncategorizedLabel,
      helper: "Review transactions in this range that still need a category.",
      href: buildUncategorizedTransactionsHref(input.range),
      tone: "attention",
    });
  }

  insights.push({
    label: "Category leader",
    value: topCategory ? topCategory.category : "Not ready yet",
    helper: topCategory
      ? `${topCategory.share}% of categorized spending \u00b7 ${formatCurrency(topCategory.totalSpend)}`
      : input.sectionStatus.categories === "incomplete"
        ? "Add more categories to make this view clearer."
        : "There isn't any categorized spending in this period yet.",
    href: topCategory
      ? buildTransactionsHref({
          ...getRangeParams(input.range),
          category: topCategory.category,
        })
      : null,
    tone: "neutral",
  });

  insights.push({
    label: "Import health",
    value:
      input.importIssueCount > 0
        ? `${formatNumber(input.importIssueCount)} issues flagged`
        : input.sectionStatus.imports === "empty"
          ? "No imports yet"
          : "All imports parsed",
    helper:
      input.importIssueCount > 0
        ? "Failed or unreadable messages are waiting for review."
        : input.sectionStatus.imports === "empty"
          ? "Import messages to start filling out the dashboard."
          : "No import issues in this period.",
    href: null,
    tone: input.importIssueCount > 0 ? "attention" : "info",
  });

  insights.push({
    label: "Category shift",
    value: topCategory
      ? previousTopCategory && previousTopCategory.category !== topCategory.category
        ? `${previousTopCategory.category} to ${topCategory.category}`
        : `${topCategory.category} leads`
      : "No category signal",
    helper: input.comparison
      ? `Compared with ${input.comparison.rangeLabel}`
      : "No previous period available for category comparison.",
    href: topCategory
      ? buildTransactionsHref({
          ...getRangeParams(input.range),
          category: topCategory.category,
        })
      : null,
    tone: "neutral",
  });

  return insights;
}

export function buildBiggestChangeCard(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
  categories: DashboardCategorySpendDto[];
  range: DashboardPageData["range"];
}): DashboardRightRailCardVm {
  const topCategory = getTopCategoryInsight(
    input.categories,
    getKnownSpendTotal(input.categories)
  );
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        getKnownSpendTotal(input.comparison.spendingByCategory)
      )
    : null;

  if (!topCategory) {
    return {
      label: "Category shift",
      value: "No category signal",
      helper: "Categorize more spending to surface the clearest shift.",
      href: null,
      tone: "neutral",
    };
  }

  if (previousTopCategory && previousTopCategory.category !== topCategory.category) {
    return {
      label: "Category shift",
      value: `${topCategory.category} is now your top known category`,
      helper: input.comparison
        ? `Compared with ${formatCompactRangeLabel(input.comparison.rangeLabel)}`
        : "No previous period available for comparison.",
      href: buildTransactionsHref({
        ...getRangeParams(input.range),
        category: topCategory.category,
      }),
      tone: "neutral",
    };
  }

  const biggestMovement = getBiggestCategoryMovement(
    input.categories,
    input.comparison?.spendingByCategory ?? []
  );
  if (!biggestMovement) {
    return {
      label: "Category shift",
      value: `${topCategory.category} is your top known category`,
      helper: input.comparison
        ? `Compared with ${formatCompactRangeLabel(input.comparison.rangeLabel)}`
        : "No previous period available for comparison.",
      href: buildTransactionsHref({
        ...getRangeParams(input.range),
        category: topCategory.category,
      }),
      tone: "neutral",
    };
  }

  return {
    label: "Biggest category movement",
    value: `${biggestMovement.category} ${biggestMovement.delta >= 0 ? "+" : "-"}${formatCurrency(
      Math.abs(biggestMovement.delta)
    )}`,
    helper: input.comparison
      ? `Compared with ${formatCompactRangeLabel(input.comparison.rangeLabel)}`
      : "No previous period available for comparison.",
    href: buildTransactionsHref({
      ...getRangeParams(input.range),
      category: biggestMovement.category,
    }),
    tone: "neutral",
  };
}

export function buildSuggestedRules(input: {
  recipients: DashboardPageData["frequentRecipients"];
}): DashboardSuggestedRuleVm[] {
  return input.recipients
    .filter((recipient) => recipient.paymentCount >= 2)
    .slice(0, 2)
    .map((recipient) => {
      const action = getRecipientReviewAction(recipient);
      return {
        recipient: recipient.recipient,
        action,
        href: getRecipientActionHref(recipient.recipientUuid, action),
        paymentCount: recipient.paymentCount,
        totalAmount: recipient.totalAmount,
      };
    });
}

export function buildMostFrequentRecipient(input: {
  recipients: DashboardPageData["frequentRecipients"];
}): DashboardRecipientInsightVm | null {
  const recipient = input.recipients.find((item) => item.paymentCount >= 2);
  if (!recipient) {
    return null;
  }

  const action = getRecipientReviewAction(recipient);
  return {
    recipient: recipient.recipient,
    paymentCount: recipient.paymentCount,
    totalAmount: recipient.totalAmount,
    action,
    href: getRecipientActionHref(recipient.recipientUuid, action),
    helper:
      action === "Create rule"
        ? "Good candidate for a rule"
        : "Review repeated payments",
  };
}

export function buildFrequentRecipientRows(input: {
  recipients: DashboardPageData["frequentRecipients"];
}) {
  return input.recipients.map((recipient) => {
    const action = getRecipientReviewAction(recipient);

    return {
      ...recipient,
      action,
      href: getRecipientActionHref(recipient.recipientUuid, action),
    };
  });
}

function formatCompactRangeLabel(rangeLabel: string) {
  const [startDate, endDate] = rangeLabel.split(" to ");
  if (!startDate || !endDate) {
    return rangeLabel;
  }

  const start = parseDateOnlyForDisplay(startDate);
  const end = parseDateOnlyForDisplay(endDate);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" as const }),
  }).format(end);

  return `${startLabel} - ${endLabel}`;
}

function getBiggestCategoryMovement(
  currentCategories: DashboardCategorySpendDto[],
  previousCategories: DashboardCategorySpendDto[]
) {
  const totals = new Map<string, number>();

  for (const category of getKnownSpendingCategories(previousCategories)) {
    totals.set(category.category, -category.totalSpend);
  }

  for (const category of getKnownSpendingCategories(currentCategories)) {
    totals.set(category.category, (totals.get(category.category) ?? 0) + category.totalSpend);
  }

  let biggestMovement: { category: string; delta: number } | null = null;

  for (const [category, delta] of totals.entries()) {
    if (!biggestMovement || Math.abs(delta) > Math.abs(biggestMovement.delta)) {
      biggestMovement = { category, delta };
    }
  }

  if (!biggestMovement || biggestMovement.delta === 0) {
    return null;
  }

  return biggestMovement;
}
