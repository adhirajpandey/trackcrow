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
  RecipientListResponse,
  RecipientsApiQuery,
  RecipientsQueryResult,
} from "./types";

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
