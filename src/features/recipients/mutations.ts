"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPatch, apiPost } from "@/lib/api/client";
import { dashboardQueryKeys } from "@/features/dashboard/query-keys";
import { transactionsQueryKeys } from "@/features/transactions/query-keys";

import { recipientsQueryKeys } from "./query-keys";
import type {
  RecipientAliasTransferImpact,
  RecipientAliasWriteDto,
  RecipientCreateDto,
  RecipientListItemDto,
} from "./types";

export function useCreateRecipientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { displayName: string }) =>
      apiPost<RecipientCreateDto>("/api/recipients", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipientsQueryKeys.all });
    },
  });
}

export type AddRecipientAliasInput = {
  recipientUuid: string;
  value: string;
  aliasType?: string;
  transfer?: boolean;
};

export type AddRecipientAliasResponse = RecipientAliasWriteDto;
export type AliasTransferImpact = RecipientAliasTransferImpact;

export function useAddRecipientAliasMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientUuid, ...input }: AddRecipientAliasInput) =>
      apiPost<AddRecipientAliasResponse>(
        `/api/recipients/${recipientUuid}/aliases`,
        input
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recipientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
      ]);
    },
  });
}

export function useUpdateRecipientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipientUuid,
      displayName,
    }: {
      recipientUuid: string;
      displayName: string;
    }) =>
      apiPatch<RecipientListItemDto>(`/api/recipients/${recipientUuid}`, {
        displayName,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recipientsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
      ]);
    },
  });
}
