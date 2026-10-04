import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Credentials } from '../../lib/api/client';
import { fetchTransactions } from '../../lib/api/transactions';
import { queryKeys } from '../../lib/query-keys';

export function useReviewQueue(c: Credentials, startDate?: string, endDate?: string) {
  const filters = {
    category: ['Uncategorized'],
    startDate,
    endDate,
    size: 30,
    sortBy: 'timestamp' as const,
    sortOrder: 'desc' as const,
  };
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl, filters), 'review'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchTransactions(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
  });
  const rows = useMemo(
    () =>
      [
        ...new Map(
          (query.data?.pages.flatMap((page) => page.transactions) ?? []).map((row) => [row.uuid, row]),
        ).values(),
      ].filter((row) => !row.categoryUuid),
    [query.data],
  );
  return { query, rows, total: query.data?.pages[0]?.total ?? 0 };
}
