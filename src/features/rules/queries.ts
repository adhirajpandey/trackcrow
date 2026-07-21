"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import { buildRulesSearchParams } from "./query-state";
import type { RuleListResponse, RulesQuery } from "./types";

export function useRulesQuery(query: RulesQuery, initialData: RuleListResponse) {
  return useQuery({
    queryKey: ["rules", "list", query],
    queryFn: () => apiGet<RuleListResponse>(`/api/rules?${buildRulesSearchParams(query)}`),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
