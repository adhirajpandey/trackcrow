import type { RecipientFilters } from './api/recipients';

export type RecipientBounds = {
  minTransactionCount: string;
  maxTransactionCount: string;
  minTotalAmount: string;
  maxTotalAmount: string;
};
export const emptyRecipientBounds: RecipientBounds = {
  minTransactionCount: '', maxTransactionCount: '', minTotalAmount: '', maxTotalAmount: '',
};
export function parseRecipientBounds(draft: RecipientBounds): {
  filters: RecipientFilters; error?: string;
} {
  const filters: RecipientFilters = {};
  for (const key of Object.keys(draft) as (keyof RecipientBounds)[]) {
    const text = draft[key].trim();
    if (!text) continue;
    const value = Number(text);
    if (!/^\d+(\.\d+)?$/.test(text) || !Number.isFinite(value) || value < 0 ||
        (key.includes('Count') && !Number.isSafeInteger(value))) {
      return { filters: {}, error: 'Enter non-negative amounts and whole transaction counts.' };
    }
    filters[key] = value;
  }
  if ((filters.minTransactionCount ?? 0) > (filters.maxTransactionCount ?? Infinity) ||
      (filters.minTotalAmount ?? 0) > (filters.maxTotalAmount ?? Infinity)) {
    return { filters: {}, error: 'Each maximum must be at least its minimum.' };
  }
  return { filters };
}
