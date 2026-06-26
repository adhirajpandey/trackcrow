"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TransactionListResponse, TransactionRecord } from "@/common/types";
import { apiGet } from "@/lib/api/client";

import {
  buildTransactionsApiSearchParams,
  buildTransactionsQueryResult,
  isSameTransactionsQuery,
} from "./query-state";
import { transactionsQueryKeys } from "./query-keys";
import type {
  TransactionDetailSuggestion,
  TransactionsApiQuery,
  TransactionsQueryResult,
} from "./types";

export async function getTransactionsQueryData(
  query: TransactionsApiQuery
): Promise<TransactionsQueryResult> {
  const params = buildTransactionsApiSearchParams(query);
  const transactions = await apiGet<TransactionListResponse>(
    `/api/transactions?${params.toString()}`
  );

  return buildTransactionsQueryResult({
    transactions,
  });
}

export function getTransactionQueryData(transactionId: number) {
  return apiGet<TransactionRecord>(`/api/transactions/${transactionId}`);
}

export function getTransactionSuggestionData(transactionId: number) {
  return apiGet<TransactionDetailSuggestion>(`/api/transactions/${transactionId}/suggest`);
}

export function useTransactionsQuery(input: {
  query: TransactionsApiQuery;
  initialQuery: TransactionsApiQuery;
  initialData?: TransactionsQueryResult;
}) {
  const initialData = isSameTransactionsQuery(input.query, input.initialQuery)
    ? input.initialData
    : undefined;

  return useQuery({
    queryKey: transactionsQueryKeys.list(input.query),
    queryFn: () => getTransactionsQueryData(input.query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useTransactionQuery(input: {
  transactionId: number;
  initialData: TransactionRecord;
}) {
  return useQuery({
    queryKey: transactionsQueryKeys.detail(input.transactionId),
    queryFn: () => getTransactionQueryData(input.transactionId),
    initialData: input.initialData,
    staleTime: 0,
  });
}
