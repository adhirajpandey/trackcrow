import type { DashboardCategorySpendDto, DashboardPeriodSpendDto } from "@/server/page-data/dashboard-page-data";

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

export function getPeriodLabelStep(periodCount: number) {
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

export function buildChartTicks(maxValue: number) {
  if (maxValue <= 0) {
    return [];
  }

  return [0.25, 0.5, 0.75].map((ratio) => ({
    ratio,
    value: Math.round(maxValue * ratio),
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
