import { getJson, queryString, type Credentials } from './client';

export type DashboardSummary = {
  totalSpend: number;
  transactionCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  averageSpend: number;
};

export type CategorySpend = {
  category: string;
  totalSpend: number;
  transactionCount: number;
};

export type DateRange = { startDate: Date; endDate: Date };

function rangeQuery(range?: DateRange) {
  if (!range) return '';
  const params = new URLSearchParams({
    startDate: range.startDate.toISOString(),
    endDate: range.endDate.toISOString(),
  });
  return `?${params.toString()}`;
}

export function fetchSummary(credentials: Credentials, range?: DateRange, signal?: AbortSignal) {
  return getJson<DashboardSummary>(credentials, `/api/dashboard/summary${rangeQuery(range)}`, signal);
}

export function fetchCategorySpending(credentials: Credentials, range: DateRange, signal?: AbortSignal) {
  return getJson<CategorySpend[]>(credentials, `/api/dashboard/spending-by-category${rangeQuery(range)}`, signal);
}

export type PeriodSpend = { period: string; totalSpend: number; transactionCount: number };
export function fetchPeriodSpending(
  credentials: Credentials,
  range: DateRange,
  granularity: 'day' | 'week' | 'month' | 'year',
  signal?: AbortSignal,
) {
  return getJson<PeriodSpend[]>(
    credentials,
    `/api/dashboard/spending-by-period${queryString({ startDate: range.startDate.toISOString(), endDate: range.endDate.toISOString(), granularity })}`,
    signal,
  );
}
