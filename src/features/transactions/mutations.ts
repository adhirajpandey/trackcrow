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

type TransactionCreateResponse = { id: number; uuid: string };
type TransactionUpdateResponse = { id: number };

async function invalidateTransactionData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: transactionsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
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
    mutationFn: ({ transactionId, ...input }: UpdateTransactionInput) =>
      apiPatch<TransactionUpdateResponse>(`/api/transactions/${transactionId}`, input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTransactionData(queryClient),
        queryClient.invalidateQueries({
          queryKey: transactionsQueryKeys.detail(variables.transactionId),
        }),
      ]);
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId }: { transactionId: number }) =>
      apiDelete<TransactionUpdateResponse>(`/api/transactions/${transactionId}`),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTransactionData(queryClient),
        queryClient.invalidateQueries({
          queryKey: transactionsQueryKeys.detail(variables.transactionId),
        }),
      ]);
    },
  });
}

export function useUpdateTransactionCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, categoryId, subcategoryId }: UpdateTransactionCategoryInput) =>
      apiPatch<TransactionUpdateResponse>(`/api/transactions/${transactionId}/category`, {
        categoryId: categoryId ?? null,
        ...(subcategoryId !== undefined ? { subcategoryId } : {}),
      }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateTransactionData(queryClient),
        queryClient.invalidateQueries({
          queryKey: transactionsQueryKeys.detail(variables.transactionId),
        }),
      ]);
    },
  });
}
