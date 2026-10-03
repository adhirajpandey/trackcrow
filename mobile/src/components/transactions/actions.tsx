import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { CategorySheet } from '../category-sheet';
import { ConfirmDialog } from '../confirm-dialog';
import { useToast } from '../toast-host';
import type { Category } from '../../lib/api/categories';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipientDetail } from '../../lib/api/recipients';
import { createRule, updateRule } from '../../lib/api/rules';
import {
  categorizeTransaction,
  fetchRecentTransactions,
  type CategoryInput,
  type Transaction,
  type TransactionList,
  type TransactionDetail,
} from '../../lib/api/transactions';
import { queryKeys } from '../../lib/query-keys';
import { RulePrompt, type RulePromptSelection } from './rule-prompt';
import { undoClassification } from './undo-classification';
import { errorMessage, useInvalidateLedger } from './shared';
export function useClassification(
  c: Credentials,
  categories: Category[],
  onFiled?: (txn: Transaction, category: string | null) => string | void,
) {
  const client = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateLedger(c);
  const [target, setTarget] = useState<Transaction | null>(null);
  const [prompt, setPrompt] = useState<RulePromptSelection | null>(null);
  const recent = useQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl), 'recent-categories'],
    queryFn: ({ signal }) => fetchRecentTransactions(c, 60, signal),
  });
  const recentCategoryUuids = [
    ...new Set((recent.data ?? []).map((txn) => txn.categoryUuid).filter((id): id is string => Boolean(id))),
  ];
  const mutation = useMutation({
    mutationFn: ({ txn, input }: { txn: Transaction; input: CategoryInput }) =>
      categorizeTransaction(c, txn.uuid, input),
    onSuccess: (result, { txn }) => {
      client.setQueryData(queryKeys.transaction(c.apiUrl, txn.uuid), (old: TransactionDetail | undefined) =>
        old
          ? {
              ...old,
              ...result,
              classificationRule: result.classificationSource === 'RULE' ? old.classificationRule : null,
            }
          : old,
      );
      client.setQueriesData<Transaction[] | InfiniteData<TransactionList>>(
        { queryKey: queryKeys.transactions(c.apiUrl) },
        (old) => {
          const patch = (row: Transaction) => (row.uuid === txn.uuid ? { ...row, ...result } : row);
          if (Array.isArray(old)) return old.map(patch);
          if (old && 'pages' in old)
            return {
              ...old,
              pages: old.pages.map((page) => ({ ...page, transactions: page.transactions.map(patch) })),
            };
          return old;
        },
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      toast({
        message: onFiled?.(txn, result.category) || `Filed as ${result.category ?? 'Uncategorized'}.`,
        undo: () =>
          undoClassification({
            credentials: c,
            transaction: txn,
            onRestored: () => setPrompt(null),
            onError: (error) => toast({ message: errorMessage(error) }),
            invalidate,
          }),
      });
      if (result.categoryUuid && result.category)
        setPrompt({
          transaction: txn,
          categoryUuid: result.categoryUuid,
          category: result.category,
          subcategoryUuid: result.subcategoryUuid,
        });
    },
    onError: (error) => toast({ message: errorMessage(error) }),
    onSettled: () => invalidate(),
  });
  return {
    busy: mutation.isPending,
    openCategory: (txn: Transaction) => {
      if (!mutation.isPending) setTarget(txn);
    },
    classify: (txn: Transaction, input: CategoryInput) => mutation.mutateAsync({ txn, input }),
    promptOpen: Boolean(prompt),
    sheets: (
      <>
        <CategorySheet
          open={Boolean(target)}
          categories={categories}
          recentCategoryUuids={recentCategoryUuids}
          selected={target?.categoryUuid}
          selectedSubcategory={target?.subcategoryUuid}
          onClose={() => setTarget(null)}
          onSelect={(categoryUuid, subcategoryUuid) => {
            if (target && !mutation.isPending)
              mutation.mutate({ txn: target, input: { categoryUuid, subcategoryUuid } });
          }}
        />
        {prompt ? (
          <RulePrompt
            key={`${prompt.transaction.uuid}:${prompt.categoryUuid}`}
            credentials={c}
            selection={prompt}
            onClose={() => setPrompt(null)}
          />
        ) : null}
      </>
    ),
  };
}
export function IgnoreRecipient({
  credentials: c,
  transaction: txn,
  onClose,
}: {
  credentials: Credentials;
  transaction: Transaction;
  onClose: () => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateLedger(c);
  const [conflict, setConflict] = useState<string | null>(null);
  const context = useQuery({
    queryKey: ['recipient', c.apiUrl, txn.recipientUuid, 'automation'],
    queryFn: ({ signal }) => fetchRecipientDetail(c, txn.recipientUuid, signal),
  });
  const existing = conflict ?? context.data?.existingRuleUuid;
  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: `Ignore ${txn.recipientDisplayName}`.slice(0, 100),
        isEnabled: true,
        conditions: { recipient: { equals: txn.recipientUuid } },
        action: { type: 'IGNORE' as const },
      };
      return existing ? updateRule(c, existing, input) : createRule(c, input);
    },
    onSuccess: () => {
      toast({ message: 'Ignore rule saved for future SMS imports.' });
      onClose();
    },
    onError: (error) => {
      const details = (error as { details?: { existingRule?: { uuid?: string } } }).details;
      if (details?.existingRule?.uuid) setConflict(details.existingRule.uuid);
      toast({ message: errorMessage(error) });
    },
    onSettled: () => invalidate(),
  });
  const message = `Ignore future SMS imports from ${txn.recipientDisplayName}? Existing transactions stay in your ledger and review queue.${existing ? ' This replaces the recipient’s existing rule.' : ''}${context.isError ? ` ${errorMessage(context.error)} Retry the rule lookup.` : ''}`;
  return (
    <ConfirmDialog
      open
      title="Ignore recipient?"
      message={message}
      confirmLabel={
        context.isPending
          ? 'Loading…'
          : context.isError
            ? 'Retry rule lookup'
            : existing
              ? 'Replace with ignore rule'
              : 'Create ignore rule'
      }
      busy={mutation.isPending}
      onClose={onClose}
      onConfirm={() => {
        if (context.data && !context.isError && !context.isFetching) mutation.mutate();
        else void context.refetch();
      }}
    />
  );
}
