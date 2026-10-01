import { dateRange, istDateKey, monthPeriod } from './transaction-dates';
import type { PeriodSpend } from './api/dashboard';

const DAY = 86_400_000;
export const insightPeriods = [
  ['this-month', 'This month'],
  ['last-month', 'Last month'],
  ['last-3-months', 'Last 3 months'],
  ['last-6-months', 'Last 6 months'],
  ['last-12-months', 'Last 12 months'],
  ['this-year', 'This year'],
  ['custom', 'Custom'],
] as const;
export type InsightPeriod = (typeof insightPeriods)[number][0];
export type DayRange = { startDate: string; endDate: string };
export type Granularity = 'day' | 'week' | 'month';
export function addDays(key: string, days: number) {
  return new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY).toISOString().slice(0, 10);
}
export function rangeDays(range: DayRange) {
  return Math.round((new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / DAY) + 1;
}
export function insightRange(period: InsightPeriod, now = new Date(), custom?: DayRange): DayRange {
  const today = istDateKey(now);
  if (period === 'custom' && custom && dateRange(custom.startDate, custom.endDate)) return custom;
  if (period === 'last-month') {
    const { startDate, endDate } = monthPeriod(-1, now);
    return { startDate, endDate };
  }
  const offset =
    period === 'last-3-months' ? -2 : period === 'last-6-months' ? -5 : period === 'last-12-months' ? -11 : 0;
  return {
    startDate: period === 'this-year' ? `${today.slice(0, 4)}-01-01` : monthPeriod(offset, now).startDate,
    endDate: today,
  };
}
export function previousInsightRange(period: InsightPeriod, range: DayRange): DayRange {
  if (period === 'this-month') {
    const previous = monthPeriod(-1, dateRange(range.startDate, range.endDate)!.startDate);
    return {
      startDate: previous.startDate,
      endDate: `${previous.startDate.slice(0, 8)}${String(Math.min(Number(range.endDate.slice(8)), Number(previous.endDate.slice(8)))).padStart(2, '0')}`,
    };
  }
  return { startDate: addDays(range.startDate, -rangeDays(range)), endDate: addDays(range.startDate, -1) };
}
export function insightGranularity(range: DayRange): Granularity {
  if (rangeDays(range) <= 31) return 'day';
  // Six calendar months, including February and leap years.
  const start = new Date(`${range.startDate}T00:00:00Z`);
  const boundary = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 6, 1));
  const last = new Date(Date.UTC(boundary.getUTCFullYear(), boundary.getUTCMonth() + 1, 0)).getUTCDate();
  boundary.setUTCDate(Math.min(start.getUTCDate(), last));
  return range.endDate < boundary.toISOString().slice(0, 10) ? 'week' : 'month';
}
export type TrendBucket = PeriodSpend & DayRange;
export function trendBuckets(
  range: DayRange,
  granularity: Granularity,
  spending: PeriodSpend[],
): TrendBucket[] {
  const values = new Map(spending.map((entry) => [entry.period, entry]));
  const start = new Date(`${range.startDate}T00:00:00Z`);
  let key =
    granularity === 'month'
      ? `${range.startDate.slice(0, 7)}-01`
      : granularity === 'week'
        ? addDays(range.startDate, -(start.getUTCDay() + 6) % 7)
        : range.startDate;
  const result: TrendBucket[] = [];
  while (key <= range.endDate) {
    const next =
      granularity === 'month'
        ? new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 1)).toISOString().slice(0, 10)
        : addDays(key, granularity === 'week' ? 7 : 1);
    const period = granularity === 'month' ? key.slice(0, 7) : key;
    result.push({
      period,
      totalSpend: values.get(period)?.totalSpend ?? 0,
      transactionCount: values.get(period)?.transactionCount ?? 0,
      startDate: key < range.startDate ? range.startDate : key,
      endDate: addDays(next, -1) > range.endDate ? range.endDate : addDays(next, -1),
    });
    key = next;
  }
  return result;
}
