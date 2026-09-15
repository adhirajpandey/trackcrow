"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountOption } from "@/common/types";
import { apiPatch, apiPost } from "@/lib/api/client";
import { accountsQueryKeys } from "./query-keys";
import { transactionsQueryKeys } from "@/features/transactions/query-keys";

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => apiPost<AccountOption>("/api/accounts", input),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountUuid: string; name: string }) =>
      apiPatch<AccountOption>(`/api/accounts/${input.accountUuid}`, { name: input.name }),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: accountsQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
    ]),
  });
}
