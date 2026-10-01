import type { TransactionFilters, ClassificationSource } from './api/transactions';
import { dateRange } from './transaction-dates';
export type RouteParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
function values(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  // JSON preserves category names containing commas; repeated params remain supported.
  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed))
        return [
          ...new Set(
            parsed.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())),
          ),
        ];
    } catch {
      return [];
    }
  }
  return [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean))];
}
export function decodeFilters(params: RouteParams): TransactionFilters {
  const startDate = first(params.startDate),
    endDate = first(params.endDate);
  const category = values(params.category);
  const subcategory = values(params.subcategory);
  const classificationSource = values(params.classificationSource).filter(
    (source): source is ClassificationSource => ['MANUAL', 'SUGGESTION', 'RULE'].includes(source),
  );
  return {
    ...(first(params.q)?.trim() ? { q: first(params.q)!.trim() } : {}),
    ...(first(params.recipientUuid) ? { recipientUuid: first(params.recipientUuid) } : {}),
    ...(startDate && endDate && dateRange(startDate, endDate) ? { startDate, endDate } : {}),
    ...(category.length ? { category } : {}),
    ...(subcategory.length ? { subcategory } : {}),
    ...(classificationSource.length ? { classificationSource } : {}),
    sortBy: first(params.sortBy) === 'amount' ? 'amount' : 'timestamp',
    sortOrder: first(params.sortOrder) === 'asc' ? 'asc' : 'desc',
  };
}
export function encodeFilters(filters: TransactionFilters): Record<string, string> {
  return {
    q: filters.q ?? '',
    recipientUuid: filters.recipientUuid ?? '',
    startDate: filters.startDate ?? '',
    endDate: filters.endDate ?? '',
    category: JSON.stringify(filters.category ?? []),
    subcategory: JSON.stringify(filters.subcategory ?? []),
    classificationSource: JSON.stringify(filters.classificationSource ?? []),
    sortBy: filters.sortBy ?? 'timestamp',
    sortOrder: filters.sortOrder ?? 'desc',
  };
}
export function hasExtraFilters(filters: TransactionFilters) {
  return Boolean(
    filters.category?.length ||
    filters.subcategory?.length ||
    filters.classificationSource?.length ||
    filters.recipientUuid ||
    filters.sortBy === 'amount' ||
    filters.sortOrder === 'asc',
  );
}
