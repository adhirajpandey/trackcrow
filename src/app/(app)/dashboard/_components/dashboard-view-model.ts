import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import type {
  DashboardCategorySpendDto,
  DashboardImportHealthDto,
  DashboardPageData,
  DashboardPeriodSpendDto,
  DashboardSectionStatus,
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

export type ReviewTaskVm = {
  label: string;
  count: number;
  tone: "attention" | "warning" | "info";
  href: string;
  helper: string;
};

export type ReviewQueueCardVm = {
  title: string;
  href: string;
  action: string;
  hasItems: boolean;
  totalReviewCount: number;
  helper: string;
  tasks: ReviewTaskVm[];
};

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
};

export type DashboardChangeSummaryVm = {
  title: string;
  value: string;
  helper: string;
};

export type DashboardChartTooltipVm = {
  title: string;
  amountLabel: string;
  transactionLabel: string;
  comparisonLabel: string | null;
};

export type DashboardChartBucketVm = {
  period: string;
  href: string;
  height: number;
  isPeak: boolean;
  isLatest: boolean;
  label: ReturnType<typeof formatPeriodLabel>;
  showLabel: boolean;
  tooltip: DashboardChartTooltipVm;
  ariaLabel: string;
};

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

  return {
    timestampLabel: isSameDay ? timeFormatter.format(date) : shortDateFormatter.format(date),
    isSameDay,
    categoryLabel: category ?? "Uncategorized",
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

export function getUncategorizedShare(uncategorizedCount: number, transactionCount: number) {
  if (transactionCount <= 0 || uncategorizedCount <= 0) {
    return 0;
  }

  return Math.round((uncategorizedCount / transactionCount) * 100);
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

export function buildLargeTransactionsHref(range: DashboardPageData["range"]) {
  return buildTransactionsHref({
    ...getRangeParams(range),
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
}): ReviewQueueCardVm {
  const importIssueCount =
    input.importHealth.failedCount + input.importHealth.unparseableCount;
  const totalReviewCount =
    input.summary.uncategorizedCount + importIssueCount + input.largeTransactionCount;
  const hasItems =
    input.summary.uncategorizedCount > 0 ||
    importIssueCount > 0 ||
    input.largeTransactionCount > 0;
  const tasks: ReviewTaskVm[] = [
    {
      label: "Need category",
      count: input.summary.uncategorizedCount,
      tone: "attention",
      href: buildUncategorizedTransactionsHref(input.range),
      helper: "Transactions that still need a category.",
    },
    {
      label: "Import issues",
      count: importIssueCount,
      tone: "warning",
      href: buildImportsReviewHref(input.range),
      helper: "Failed or unparseable messages that need review.",
    },
    {
      label: "Large transactions",
      count: input.largeTransactionCount,
      tone: "info",
      href: buildLargeTransactionsHref(input.range),
      helper: `Transactions over ${formatCurrency(LARGE_TRANSACTION_THRESHOLD)}.`,
    },
  ];

  return {
    title: "Needs review",
    href: buildReviewQueueHref(input.range),
    action: hasItems ? "Open review tasks" : "View transactions",
    hasItems,
    totalReviewCount,
    tasks,
    helper: hasItems
      ? `${formatNumber(totalReviewCount)} review items across categories, imports, and large spends.`
      : `No open review items. Nothing over ${formatCurrency(
          LARGE_TRANSACTION_THRESHOLD
        )} in this period.`,
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

export function buildWhatChangedSummary(input: {
  summary: DashboardSummaryDto;
  comparison: DashboardPageData["comparison"];
}) : DashboardChangeSummaryVm {
  if (!input.comparison) {
    return {
      title: "What changed?",
      value: "No previous period yet",
      helper: "Add more history to compare this range with the previous one.",
    };
  }

  const delta = formatComparisonDelta(
    input.summary.totalSpend,
    input.comparison.summary.totalSpend
  );
  const amountDelta = input.summary.totalSpend - input.comparison.summary.totalSpend;
  const direction = amountDelta === 0 ? "No spend change" : amountDelta > 0 ? "Up by" : "Down by";

  return {
    title: "What changed?",
    value: delta,
    helper: `${direction} ${formatCurrency(Math.abs(amountDelta))} compared with ${input.comparison.rangeLabel}.`,
  };
}

export function buildChartTooltip(input: {
  period: DashboardPeriodSpendDto;
  averagePeriodSpend: number;
  peakPeriod: DashboardPeriodSpendDto | null;
  latestPeriod: DashboardPeriodSpendDto | null;
}): DashboardChartTooltipVm {
  const averageDelta = input.period.totalSpend - input.averagePeriodSpend;
  let comparisonLabel: string | null = null;

  if (input.peakPeriod?.period === input.period.period) {
    comparisonLabel = "Peak bucket in this range";
  } else if (input.latestPeriod?.period === input.period.period) {
    comparisonLabel = "Latest bucket in this range";
  } else if (input.averagePeriodSpend > 0) {
    comparisonLabel =
      averageDelta >= 0
        ? `${formatCurrency(Math.abs(averageDelta))} above the period average`
        : `${formatCurrency(Math.abs(averageDelta))} below the period average`;
  }

  return {
    title: formatPeriod(input.period.period),
    amountLabel: formatCurrency(input.period.totalSpend),
    transactionLabel: `${formatNumber(input.period.transactionCount)} transactions`,
    comparisonLabel,
  };
}

export function buildChartBuckets(input: {
  periods: DashboardPeriodSpendDto[];
  peakPeriod: DashboardPeriodSpendDto | null;
  latestPeriod: DashboardPeriodSpendDto | null;
  averagePeriodSpend: number;
  chartMax: number;
  periodLabelStep: number;
  granularity: DashboardPageData["range"]["granularity"];
}): DashboardChartBucketVm[] {
  return input.periods.map((item, index) => {
    const label = formatPeriodLabel(item.period);
    const isPeak = input.peakPeriod?.period === item.period;
    const isLatest = input.latestPeriod?.period === item.period;
    const showLabel =
      index === 0 ||
      index === input.periods.length - 1 ||
      index % input.periodLabelStep === 0;

    const tooltip = buildChartTooltip({
      period: item,
      averagePeriodSpend: input.averagePeriodSpend,
      peakPeriod: input.peakPeriod,
      latestPeriod: input.latestPeriod,
    });

    return {
      period: item.period,
      href: buildPeriodTransactionsHref(item.period, input.granularity),
      height:
        input.chartMax > 0 ? Math.max(6, (item.totalSpend / input.chartMax) * 100) : 6,
      isPeak,
      isLatest,
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
  const topCategory = getTopCategoryInsight(input.categories, input.summary.totalSpend);
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        input.comparison.summary.totalSpend
      )
    : null;

  const insights: DashboardInsightVm[] = [];

  if (input.summary.uncategorizedCount > 0) {
    insights.push({
      label: "Uncategorized",
      value: `${formatNumber(input.summary.uncategorizedCount)} need category`,
      helper: "Open uncategorized transactions for this range.",
      href: buildUncategorizedTransactionsHref(input.range),
      tone: "attention",
    });
  }

  insights.push({
    label: "Category leader",
    value: topCategory ? topCategory.category : "Not ready yet",
    helper: topCategory
      ? `${topCategory.share}% of spending \u00b7 ${formatCurrency(topCategory.totalSpend)}`
      : input.sectionStatus.categories === "incomplete"
        ? "Categorize more transactions to sharpen this view."
        : "No categorized spending in this range.",
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
        ? "Failed and unparseable messages waiting in review."
        : input.sectionStatus.imports === "empty"
          ? "Import messages to populate dashboard coverage."
          : "No import review items in this range.",
    href: buildImportsReviewHref(input.range),
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
  const topCategory = getTopCategoryInsight(input.categories, input.summary.totalSpend);
  const previousTopCategory = input.comparison
    ? getTopCategoryInsight(
        input.comparison.spendingByCategory,
        input.comparison.summary.totalSpend
      )
    : null;

  if (!topCategory) {
    return {
      label: "Biggest change",
      value: "No category signal",
      helper: "Categorize more spending to surface the clearest shift.",
      href: null,
      tone: "neutral",
    };
  }

  const value =
    previousTopCategory && previousTopCategory.category !== topCategory.category
      ? `${topCategory.category} up ${formatCurrency(topCategory.totalSpend)}`
      : `${topCategory.category} leads`;

  return {
    label: "Biggest change",
    value,
    helper: input.comparison
      ? `Compared with ${input.comparison.rangeLabel}`
      : "No previous period available for comparison.",
    href: buildTransactionsHref({
      ...getRangeParams(input.range),
      category: topCategory.category,
    }),
    tone: "neutral",
  };
}

export function buildSuggestedRules(input: {
  recipients: DashboardPageData["frequentRecipients"];
}): DashboardSuggestedRuleVm[] {
  return input.recipients.slice(0, 2).map((recipient) => ({
    recipient: recipient.recipient,
    action: "Create rule",
  }));
}
