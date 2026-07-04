"use client";

import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";

import { dashboardQueryKeys } from "@/features/dashboard/query-keys";

import { transactionsQueryKeys } from "./query-keys";
import type {
  TransactionMutationInput,
  UpdateTransactionCategoryInput,
  UpdateTransactionInput,
} from "./types";

type TransactionCreateResponse = { uuid: string };
type TransactionUpdateResponse = { uuid: string };

async function invalidateTransactionData(
  queryClient: QueryClient,
  options?: { refetchType?: "active" | "inactive" | "all" | "none" }
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: transactionsQueryKeys.all,
      refetchType: options?.refetchType,
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.all,
      refetchType: options?.refetchType,
    }),
  ]);
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransactionMutationInput) =>
      apiPost<TransactionCreateResponse>("/api/transactions", input),
    onSuccess: async () => {
      await invalidateTransactionData(queryClient);
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionUuid, ...input }: UpdateTransactionInput) =>
      apiPatch<TransactionUpdateResponse>(`/api/transactions/${transactionUuid}`, input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTransactionData(queryClient),
        queryClient.invalidateQueries({
          queryKey: transactionsQueryKeys.detail(variables.transactionUuid),
        }),
      ]);
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionUuid }: { transactionUuid: string }) =>
      apiDelete<TransactionUpdateResponse>(`/api/transactions/${transactionUuid}`),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: transactionsQueryKeys.detail(variables.transactionUuid),
      });
      void invalidateTransactionData(queryClient, { refetchType: "none" });
    },
  });
}

export function useUpdateTransactionCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionUuid, categoryUuid, subcategoryUuid }: UpdateTransactionCategoryInput) =>
      apiPatch<TransactionUpdateResponse>(`/api/transactions/${transactionUuid}/category`, {
        categoryUuid: categoryUuid ?? null,
        ...(subcategoryUuid !== undefined ? { subcategoryUuid } : {}),
      }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTransactionData(queryClient),
        queryClient.invalidateQueries({
          queryKey: transactionsQueryKeys.detail(variables.transactionUuid),
        }),
      ]);
    },
  });
}
