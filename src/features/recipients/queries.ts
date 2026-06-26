"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";

import { recipientsQueryKeys } from "./query-keys";
import type {
  RecipientListItemDto,
  RecipientsApiQuery,
  RecipientsQueryResult,
} from "./types";

export function getRecipientsQueryData(): Promise<RecipientListItemDto[]> {
  return apiGet<RecipientListItemDto[]>("/api/recipients");
}

export function useRecipientsQuery(input: {
  query: RecipientsApiQuery;
  initialData: RecipientsQueryResult;
}) {
  return useQuery({
    queryKey: recipientsQueryKeys.list(input.query),
    queryFn: async () => {
      const recipients = await getRecipientsQueryData();
      return {
        status: "ready" as const,
        message: null,
        recipients,
      };
    },
    initialData: input.initialData,
    staleTime: 0,
  });
}
