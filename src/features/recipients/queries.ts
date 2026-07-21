"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";

import {
  buildRecipientsApiSearchParams,
  buildRecipientsQueryResult,
  isSameRecipientsQuery,
} from "./query-state";
import { recipientsQueryKeys } from "./query-keys";
import type {
  RecipientListItemDto,
  RecipientListResponse,
  RecipientsApiQuery,
  RecipientsQueryResult,
} from "./types";

const recipientPickerQuery = {
  page: 1,
  pageSize: 10,
  sortBy: "transactionCount" as const,
  sortOrder: "desc" as const,
  minTransactionCount: null,
  maxTransactionCount: null,
  minTotalAmount: null,
  maxTotalAmount: null,
};

export function useRecipientPickerQuery(input: {
  q: string;
  initialData: RecipientListItemDto[];
}) {
  const query = { ...recipientPickerQuery, q: input.q };

  return useQuery({
    queryKey: recipientsQueryKeys.list(query),
    queryFn: () => getRecipientsQueryData(query),
    initialData:
      input.q === ""
        ? {
            status: "ready" as const,
            message: null,
            recipients: input.initialData,
            pagination: {
              page: 1,
              pageSize: 10,
              total: input.initialData.length,
              totalPages: input.initialData.length > 0 ? 1 : 0,
              hasNext: false,
              hasPrev: false,
            },
          }
        : undefined,
    staleTime: 30_000,
  });
}

export async function getRecipientsQueryData(
  query: RecipientsApiQuery
): Promise<RecipientsQueryResult> {
  const params = buildRecipientsApiSearchParams(query);
  const recipients = await apiGet<RecipientListResponse>(`/api/recipients?${params.toString()}`);

  return buildRecipientsQueryResult({
    recipients,
  });
}

export function useRecipientsQuery(input: {
  query: RecipientsApiQuery;
  initialQuery: RecipientsApiQuery;
  initialData?: RecipientsQueryResult;
}) {
  const initialData = isSameRecipientsQuery(input.query, input.initialQuery)
    ? input.initialData
    : undefined;

  return useQuery({
    queryKey: recipientsQueryKeys.list(input.query),
    queryFn: () => getRecipientsQueryData(input.query),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
