"use client";

import { useQuery } from "@tanstack/react-query";

import type { TransactionListResponse } from "@/common/types";
import { apiGet } from "@/lib/api/client";

import { transactionsQueryKeys } from "@/features/transactions/query-keys";

export type DashboardTransactionsFilter = {
  startDate: string;
  endDate: string;
  recipientUuid?: string | null;
};

/** Up to 100 transactions for a day or a recipient, oldest first. Lives under the transactions key so any transaction change refetches it. */
export function useDashboardTransactions(filter: DashboardTransactionsFilter, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [...transactionsQueryKeys.all, "dashboard", filter] as const,
    queryFn: () => {
      const params = new URLSearchParams({
        startDate: filter.startDate,
        endDate: filter.endDate,
        size: "100",
        sortBy: "timestamp",
        sortOrder: "asc",
      });
      if (filter.recipientUuid) params.set("recipientUuid", filter.recipientUuid);
      return apiGet<TransactionListResponse>(`/api/transactions?${params.toString()}`);
    },
    enabled: options.enabled ?? true,
    staleTime: 30_000,
  });
}
