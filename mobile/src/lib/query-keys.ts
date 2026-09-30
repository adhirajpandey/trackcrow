import type { DateRange } from './api/dashboard';
import type { TransactionFilters } from './api/transactions';
import type { RecipientFilters } from './api/recipients';
import type { RuleFilters } from './api/rules';
const rangeKey = (range?: DateRange) =>
  range ? [range.startDate.toISOString(), range.endDate.toISOString()] : ['all-time'];
// Prefixes support invalidation across list pages and periods. No tokens enter query keys.
export const queryKeys = {
  summary: (url: string, range?: DateRange) => ['summary', url, ...rangeKey(range)] as const,
  categorySpending: (url: string, range: DateRange) => ['category-spending', url, ...rangeKey(range)] as const,
  periodSpending: (url: string, range: DateRange, granularity: string) =>
    ['period-spending', url, ...rangeKey(range), granularity] as const,
  transactions: (url: string, filters?: TransactionFilters) =>
    filters ? (['transactions', url, filters] as const) : (['transactions', url] as const),
  transaction: (url: string, id: string) => ['transaction', url, id] as const,
  recipients: (url: string, filters?: RecipientFilters) =>
    filters ? (['recipients', url, filters] as const) : (['recipients', url] as const),
  recipient: (url: string, id: string) => ['recipient', url, id] as const,
  rules: (url: string, filters?: RuleFilters) =>
    filters ? (['rules', url, filters] as const) : (['rules', url] as const),
  categories: (url: string) => ['categories', url] as const,
  accounts: (url: string) => ['accounts', url] as const,
};
