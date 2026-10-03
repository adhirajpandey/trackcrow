import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FileText, Funnel, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { SearchField } from '../../components/search-field';
import { Button, DashedPanel, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { useClassification } from '../../components/transactions/actions';
import { FilterSheet } from '../../components/transactions/filter-sheet';
import { LedgerRow } from '../../components/transactions/ledger-row';
import { PeriodRangeSheet } from '../../components/transactions/period-range-sheet';
import {
  TransactionSession,
  errorMessage,
  useTransactionOptions,
} from '../../components/transactions/shared';
import { fetchTransactions, type Transaction, type TransactionFilters } from '../../lib/api/transactions';
import type { Credentials } from '../../lib/api/client';
import { formatCurrency } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { groupTransactionDays } from '../../lib/transaction-days';
import { dayLabel, monthPeriod } from '../../lib/transaction-dates';
import { decodeFilters, encodeFilters, hasExtraFilters } from '../../lib/transaction-filters';
import { useSmsIngestion } from '../../lib/sms-ingestion';
import { fetchSummary } from '../../lib/api/dashboard';
import { colors, minTarget, radii, shadows } from '../../theme';
export default function TransactionsScreen() {
  return (
    <TransactionSession>{(credentials) => <Transactions credentials={credentials} />}</TransactionSession>
  );
}
function Transactions({ credentials: c }: { credentials: Credentials }) {
  const sms = useSmsIngestion();
  const importing = sms.enabled && !sms.authError;
  const summary = useQuery({
    queryKey: queryKeys.summary(c.apiUrl),
    queryFn: ({ signal }) => fetchSummary(c, undefined, signal),
  });
  const params = useLocalSearchParams();
  const decoded = decodeFilters(params);
  const serialized = JSON.stringify(decoded);
  // Stable filters keep debounce, memoized grouping, and query keys independent of renders.
  const filters: TransactionFilters = useMemo(() => JSON.parse(serialized), [serialized]);
  const routeQuery = filters.q ?? '';
  const [searchDraft, setSearchDraft] = useState(() => ({ routeQuery, value: routeQuery }));
  if (searchDraft.routeQuery !== routeQuery) setSearchDraft({ routeQuery, value: routeQuery });
  const search = searchDraft.value;
  const [filterOpen, setFilterOpen] = useState(false),
    [customOpen, setCustomOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const list = useRef<FlashListRef<ReturnType<typeof groupTransactionDays>[number]>>(null);
  const options = useTransactionOptions(c);
  const classification = useClassification(c, options.categories.data ?? []);
  useEffect(() => {
    if (search.trim() === routeQuery) return;
    const timer = setTimeout(() => router.setParams(encodeFilters({ ...filters, q: search.trim() })), 300);
    return () => clearTimeout(timer);
  }, [search, routeQuery, filters]);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [serialized]);
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl, { ...filters, size: 30 }), 'infinite'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchTransactions(c, { ...filters, page: pageParam, size: 30 }, signal),
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  });
  const transactions = useMemo(() => {
    const unique = new Map<string, Transaction>();
    query.data?.pages.forEach((page) =>
      page.transactions.forEach((txn) => {
        if (!unique.has(txn.uuid)) unique.set(txn.uuid, txn);
      }),
    );
    return [...unique.values()];
  }, [query.data]);
  const items = useMemo(() => groupTransactionDays(transactions), [transactions]);
  const stickyHeaderIndices = useMemo(
    () => items.flatMap((item, index) => (item.kind === 'day' ? [index] : [])),
    [items],
  );
  const total = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const periods = [0, -1, -2].map((offset) => monthPeriod(offset, now));
  const activePeriod = periods.find(
    (period) => filters.startDate === period.startDate && filters.endDate === period.endDate,
  );
  const filtered = hasExtraFilters(filters);
  function apply(next: TransactionFilters) {
    router.setParams(encodeFilters(next));
    setFilterOpen(false);
    setCustomOpen(false);
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Transactions" />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <SearchField
              label="Search transactions"
              placeholder="Recipient, reference, remarks"
              value={search}
              onChangeText={(value) => {
                setSearchDraft({ routeQuery, value });
              }}
              autoCapitalize="none"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filtered ? 'Filter, filters applied' : 'Filter'}
            onPress={() => setFilterOpen(true)}
            style={({ pressed }) => [styles.filter, pressed ? styles.filterPressed : styles.filterShadow]}
          >
            <Funnel size={22} color={colors.foreground} strokeWidth={2.25} />
            {/* A dot, not only color, shows that filters beyond the period are applied. */}
            {filtered ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {periods.map((period) => (
            <Button
              key={period.startDate}
              label={period.label}
              selected={period === activePeriod}
              variant={period === activePeriod ? 'primary' : 'secondary'}
              onPress={() => apply({ ...filters, startDate: period.startDate, endDate: period.endDate })}
            />
          ))}
          <Button
            label="Custom"
            selected={Boolean(filters.startDate) && !activePeriod}
            variant={filters.startDate && !activePeriod ? 'primary' : 'secondary'}
            onPress={() => setCustomOpen(true)}
          />
        </ScrollView>
        <Panel tone="muted" style={{ padding: 10 }}>
          <Text style={type.body}>
            Showing {transactions.length} of {query.data?.pages[0]?.total ?? '…'} entries ·{' '}
            {formatCurrency(total)} loaded
          </Text>
        </Panel>
        {summary.data && summary.data.uncategorizedCount > 0 && !routeQuery ? (
          <Panel raised style={{ padding: 16, gap: 8, backgroundColor: colors.uncategorized }}>
            <Text style={type.heading}>{summary.data.uncategorizedCount} to review</Text>
            <Text style={type.muted}>These transactions still need a category.</Text>
            <Button label="Open review queue" variant="secondary" onPress={() => router.push('/review')} />
          </Panel>
        ) : null}
      </View>
      {query.isPending ? (
        <View style={{ padding: 16 }}>
          <Skeleton height={140} />
        </View>
      ) : null}
      <FlashList
        ref={list}
        data={items}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.kind}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View
              style={{
                backgroundColor: colors.background,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <Text style={type.label}>{dayLabel(item.day)}</Text>
              <Text style={type.number}>
                {formatCurrency(item.total)} · {item.count} loaded
              </Text>
            </View>
          ) : (
            <LedgerRow
              transaction={item.transaction}
              showActions={false}
              disabled={classification.busy || classification.promptOpen}
              onClassify={classification.openCategory}
              onIgnore={() => undefined}
            />
          )
        }
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          setNow(new Date());
          void query.refetch();
        }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError)
            void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !query.isPending && !query.isError ? (
            !sms.ready || summary.isPending ? (
              <Skeleton height={140} />
            ) : summary.isError ? (
              <InlineError message={errorMessage(summary.error)} onRetry={() => void summary.refetch()} />
            ) : (
              <DashedPanel style={{ marginHorizontal: 16 }}>
                <FileText size={56} color={colors.foreground} strokeWidth={1.5} />
                <Text style={[type.heading, styles.center]}>
                  {summary.data?.transactionCount
                    ? 'No matching transactions'
                    : importing
                      ? 'No transactions yet'
                      : 'Track expenses manually'}
                </Text>
                <Text style={[type.muted, styles.center]}>
                  {summary.data?.transactionCount
                    ? 'Try another period or clear your filters.'
                    : importing
                      ? 'Your transactions from bank SMS will appear here automatically. You can also add an expense manually.'
                      : 'Auto-import is off. Add expenses manually, or turn it on by running setup again in Settings.'}
                </Text>
                <Button
                  label="Add transaction"
                  icon={Plus}
                  style={styles.stretch}
                  onPress={() => router.push('/transactions/new')}
                />
              </DashedPanel>
            )
          ) : null
        }
        ListFooterComponent={
          <View style={{ padding: 16, gap: 12 }}>
            {query.isError ? (
              <InlineError
                message={errorMessage(query.error)}
                onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
              />
            ) : null}
            {query.hasNextPage ? (
              <Button
                label={query.isFetchingNextPage ? 'Loading…' : 'Load more'}
                variant="secondary"
                disabled={query.isFetching}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null}
            {options.categories.isError ? (
              <InlineError
                message={errorMessage(options.categories.error)}
                onRetry={() => void options.categories.refetch()}
              />
            ) : null}
          </View>
        }
      />
      {/* The empty state carries its own Add button. */}
      {items.length > 0 || query.isPending || query.isError ? (
        <View style={{ position: 'absolute', bottom: 16, right: 16 }}>
          <Button label="Add transaction" icon={Plus} onPress={() => router.push('/transactions/new')} />
        </View>
      ) : null}
      {filterOpen ? (
        <FilterSheet
          filters={filters}
          categories={options.categories.data ?? []}
          onApply={apply}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
      {customOpen ? (
        <PeriodRangeSheet
          startDate={filters.startDate ?? periods[0].startDate}
          endDate={filters.endDate ?? periods[0].endDate}
          onApply={(startDate, endDate) => apply({ ...filters, startDate, endDate })}
          onClose={() => setCustomOpen(false)}
        />
      ) : null}
      {classification.sheets}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  filter: {
    width: minTarget + 8,
    height: minTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  filterShadow: { boxShadow: shadows.control },
  filterPressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.destructive,
  },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: 4 },
});
