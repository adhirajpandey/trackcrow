"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPost } from "@/lib/api/client";
import { dashboardQueryKeys } from "@/features/dashboard/query-keys";
import { transactionsQueryKeys } from "@/features/transactions/query-keys";

import { recipientsQueryKeys } from "./query-keys";
import type {
  RecipientIdentifierTransferImpact,
  RecipientIdentifierWriteDto,
} from "./types";

export type AddRecipientIdentifierInput = {
  recipientId: number;
  value: string;
  kind?: string;
  transfer?: boolean;
};

export type AddRecipientIdentifierResponse = RecipientIdentifierWriteDto;
export type IdentifierTransferImpact = RecipientIdentifierTransferImpact;

export function useAddRecipientIdentifierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipientId, ...input }: AddRecipientIdentifierInput) =>
      apiPost<AddRecipientIdentifierResponse>(
        `/api/recipients/${recipientId}/identifiers`,
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
