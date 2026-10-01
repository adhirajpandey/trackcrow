import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState } from '../components/empty-state';
import { useClassification, IgnoreRecipient } from '../components/transactions/actions';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useTransactionOptions,
} from '../components/transactions/shared';
import { Button, InlineError, Panel, Skeleton, TextLink, type } from '../components/ui';
import {
  fetchCategorySuggestion,
  fetchRecentTransactions,
  fetchTransactions,
  type Transaction,
} from '../lib/api/transactions';
import type { Credentials } from '../lib/api/client';
import { formatCurrency, formatTransactionTime } from '../lib/format';
import { queryKeys } from '../lib/query-keys';
import { decodeFilters } from '../lib/transaction-filters';
export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const { startDate, endDate } = decodeFilters(params);
  return (
    <TransactionSession>
      {(credentials) => <Review credentials={credentials} startDate={startDate} endDate={endDate} />}
    </TransactionSession>
  );
}
function Review({
  credentials: c,
  startDate,
  endDate,
}: {
  credentials: Credentials;
  startDate?: string;
  endDate?: string;
}) {
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [ignore, setIgnore] = useState<Transaction | null>(null);
  const options = useTransactionOptions(c);
  const filters = {
    category: ['Uncategorized'],
    startDate,
    endDate,
    size: 30,
    sortBy: 'timestamp' as const,
    sortOrder: 'desc' as const,
  };
  const queue = useInfiniteQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl, filters), 'review'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchTransactions(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
  });
  const rows = useMemo(
    () => [
      ...new Map(
        (queue.data?.pages.flatMap((page) => page.transactions) ?? []).map((row) => [row.uuid, row]),
      ).values(),
    ],
    [queue.data],
  );
  const txn = rows.find((row) => !row.categoryUuid && !skipped.has(row.uuid));
  const remaining = Math.max(
    0,
    (queue.data?.pages[0]?.total ?? 0) - rows.filter((row) => Boolean(row.categoryUuid)).length,
  );
  const classification = useClassification(
    c,
    options.categories.data ?? [],
    (_txn, category) => `Filed as ${category ?? 'Uncategorized'}, ${Math.max(0, remaining - 1)} left.`,
  );
  const suggestion = useQuery({
    queryKey: [...queryKeys.transaction(c.apiUrl, txn?.uuid ?? ''), 'suggestion'],
    enabled: Boolean(txn),
    queryFn: ({ signal }) => fetchCategorySuggestion(c, txn!.uuid, signal),
  });
  const recent = useQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl), 'recent-categories'],
    queryFn: ({ signal }) => fetchRecentTransactions(c, 60, signal),
  });
  const recentIds = [
    ...new Set((recent.data ?? []).map((row) => row.categoryUuid).filter((id): id is string => Boolean(id))),
  ];
  const choices = [
    ...new Set(
      [
        suggestion.data?.suggestedCategoryUuid,
        ...recentIds,
        ...(options.categories.data ?? []).map((category) => category.uuid),
      ].filter((id): id is string => Boolean(id)),
    ),
  ]
    .map((id) => options.categories.data?.find((category) => category.uuid === id))
    .filter((category) => Boolean(category))
    .slice(0, 4);
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = queue;
  useEffect(() => {
    if (!txn && hasNextPage && !isFetching && !isFetchNextPageError) void fetchNextPage();
  }, [txn, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  async function pick(categoryUuid: string) {
    if (!txn) return;
    const isSuggestion = suggestion.data?.suggestedCategoryUuid === categoryUuid;
    try {
      await classification.classify(txn, {
        categoryUuid,
        subcategoryUuid: isSuggestion ? suggestion.data!.suggestedSubcategoryUuid : null,
        ...(isSuggestion ? { classificationIntent: 'SUGGESTION' as const } : {}),
      });
    } catch {
      void suggestion.refetch();
    }
  }
  const busy = classification.busy || classification.promptOpen || queue.isRefetching;
  return (
    <TransactionPage title="Review transactions">
      <Panel tone="review" style={{ padding: 12 }}>
        <Text accessibilityLiveRegion="polite" style={type.heading}>
          {queue.isPending ? 'Loading queue…' : `${remaining} remaining`}
        </Text>
        {startDate ? (
          <Text style={type.muted}>
            {startDate} to {endDate} · IST
          </Text>
        ) : null}
      </Panel>
      {queue.isPending || (!txn && queue.isFetching) ? <Skeleton height={240} /> : null}
      {queue.isError ? (
        <InlineError
          message={errorMessage(queue.error)}
          onRetry={() => void (queue.isFetchNextPageError ? queue.fetchNextPage() : queue.refetch())}
        />
      ) : null}
      {txn ? (
        <>
          <Panel tone="mint" style={{ padding: 16, gap: 8 }}>
            <Text style={[type.number, { fontSize: 40 }]}>{formatCurrency(txn.amount)}</Text>
            <Text style={type.heading}>{txn.recipientDisplayName}</Text>
            <Text style={type.muted}>
              {txn.type} · {txn.accountName ?? 'No account'} · {formatTransactionTime(txn.timestamp)}
            </Text>
            <TextLink
              label="Open details"
              onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } })}
            />
          </Panel>
          <Text style={type.label}>Choose a category</Text>
          <View style={{ gap: 12 }}>
            {choices.map((category) =>
              category ? (
                <Button
                  key={category.uuid}
                  label={`${category.name}${suggestion.data?.suggestedCategoryUuid === category.uuid ? ' · Suggested' : ''}`}
                  style={{ minHeight: 64 }}
                  disabled={busy || suggestion.isFetching}
                  onPress={() => void pick(category.uuid)}
                />
              ) : null,
            )}
          </View>
          <Button
            label="More…"
            variant="secondary"
            disabled={busy}
            onPress={() => classification.openCategory(txn)}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button
              label="Skip"
              variant="secondary"
              disabled={busy}
              onPress={() => setSkipped((old) => new Set([...old, txn.uuid]))}
            />
            <Button label="Ignore" variant="secondary" disabled={busy} onPress={() => setIgnore(txn)} />
          </View>
        </>
      ) : !queue.isPending && !queue.isFetching && !queue.isError ? (
        remaining === 0 ? (
          <EmptyState
            title="You're all caught up."
            message="New uncategorized transactions will appear here."
          />
        ) : (
          <>
            <EmptyState
              title="Skipped for now"
              message={`${remaining} transactions still need a category.`}
            />
            <Button
              label="Review skipped transactions"
              onPress={() => {
                setSkipped(new Set());
                void queue.refetch();
              }}
            />
          </>
        )
      ) : null}
      {options.categories.isError ? (
        <InlineError
          message={errorMessage(options.categories.error)}
          onRetry={() => void options.categories.refetch()}
        />
      ) : null}
      {recent.isError ? (
        <InlineError message={errorMessage(recent.error)} onRetry={() => void recent.refetch()} />
      ) : null}
      {suggestion.isError && txn ? (
        <InlineError message={errorMessage(suggestion.error)} onRetry={() => void suggestion.refetch()} />
      ) : null}
      {classification.sheets}
      {ignore ? (
        <IgnoreRecipient credentials={c} transaction={ignore} onClose={() => setIgnore(null)} />
      ) : null}
    </TransactionPage>
  );
}
