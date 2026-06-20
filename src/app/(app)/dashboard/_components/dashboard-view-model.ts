import type {
  DashboardCategorySpendDto,
  DashboardImportHealthDto,
  DashboardPeriodSpendDto,
  DashboardSummaryDto,
} from "@/server/page-data/dashboard-page-data";

const fullCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

export function formatPeriodLabel(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    return { month: period, year: null as string | null };
  }

  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return {
    month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
    year,
  };
}

export function formatPeriod(period: string) {
  const label = formatPeriodLabel(period);
  return label.year ? `${label.month} ${label.year}` : label.month;
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

function getNiceTickCeiling(maxValue: number) {
  if (maxValue <= 0) {
    return 0;
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const normalized = maxValue / magnitude;
  const ceiling = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return ceiling * magnitude;
}

export function buildChartTicks(maxValue: number) {
  const ceiling = getNiceTickCeiling(maxValue);
  if (ceiling <= 0) {
    return [];
  }

  return [0.33, 0.66, 1].map((ratio) => ({
    ratio,
    value: Math.round(ceiling * ratio),
  }));
}

export function getCategoryShare(itemTotal: number, totalSpend: number) {
  if (totalSpend <= 0) {
    return 0;
  }

  return Math.round((itemTotal / totalSpend) * 100);
}

export function getTopCategoryInsight(
  categories: DashboardCategorySpendDto[],
  totalSpend: number
) {
  const topCategory = categories[0];
  if (!topCategory) {
    return null;
  }

  return {
    ...topCategory,
    share: getCategoryShare(topCategory.totalSpend, totalSpend),
  };
}

export function formatCurrency(value: number) {
  return fullCurrencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 100000) {
    return `${sign}₹${trimTrailingZeros(absolute / 100000, 2)}L`;
  }

  if (absolute >= 1000) {
    return `${sign}₹${trimTrailingZeros(absolute / 1000, 1)}K`;
  }

  return `${sign}${fullCurrencyFormatter.format(absolute)}`;
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

export function buildTransactionsHref(params: Record<string, string | number | null>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildReviewItems(input: {
  summary: DashboardSummaryDto;
  importHealth: DashboardImportHealthDto;
}) {
  const totalImports =
    input.importHealth.parsedCount +
    input.importHealth.failedCount +
    input.importHealth.unparseableCount;
  const uncategorizedShare = getCategoryShare(
    input.summary.uncategorizedCount,
    input.summary.transactionCount
  );
  const importIssueCount =
    input.importHealth.failedCount + input.importHealth.unparseableCount;

  return [
    {
      key: "uncategorized",
      label: "Uncategorized transactions",
      value: input.summary.uncategorizedCount,
      helper: `${uncategorizedShare}% of transactions need a category`,
      href: buildTransactionsHref({ status: "uncategorized" }),
      tone: input.summary.uncategorizedCount > 0 ? "attention" : "neutral",
    },
    {
      key: "imports",
      label: "Import issues",
      value: importIssueCount,
      helper:
        totalImports > 0
          ? `${formatNumber(input.importHealth.failedCount)} failed, ${formatNumber(
              input.importHealth.unparseableCount
            )} unparseable`
          : "No SMS imports in this range",
      href: "/imports/review",
      tone: importIssueCount > 0 ? "danger" : "neutral",
    },
    {
      key: "large",
      label: "Large transactions",
      value: input.summary.transactionCount > 0 ? "Review" : "None",
      helper: "Check the highest value transactions in this range",
      href: buildTransactionsHref({ sort: "amount_desc" }),
      tone: "info",
    },
  ] as const;
}