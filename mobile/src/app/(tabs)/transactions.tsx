import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, FileText, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { FilterButton } from '../../components/filter-button';
import { SelectRow } from '../../components/form-controls';
import { SelectSheet } from '../../components/select-sheet';
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
import { colors } from '../../theme';
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
    [customOpen, setCustomOpen] = useState(false),
    [periodOpen, setPeriodOpen] = useState(false);
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
  const periodLabel =
    activePeriod?.label ??
    (filters.startDate && filters.endDate ? `${dayLabel(filters.startDate)} – ${dayLabel(filters.endDate)}` : 'All time');
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
          <FilterButton active={filtered} onPress={() => setFilterOpen(true)} />
        </View>
        <SelectRow
          label="Period"
          icon={Calendar}
          chevron="down"
          value={periodLabel}
          placeholder="All time"
          chosen={Boolean(filters.startDate)}
          onPress={() => setPeriodOpen(true)}
        />
        <Panel tone="muted" style={{ padding: 10 }}>
          <Text style={type.body}>
            Showing {transactions.length} of {query.data?.pages[0]?.total ?? '…'} entries ·{' '}
            {formatCurrency(total)} loaded
          </Text>
        </Panel>
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
      <SelectSheet
        open={periodOpen}
        title="Period"
        searchable={false}
        options={[
          { value: 'all', label: 'All time' },
          ...periods.map((period) => ({ value: period.startDate, label: period.label })),
          { value: 'custom', label: 'Custom range…' },
        ]}
        selected={activePeriod?.startDate ?? (filters.startDate ? 'custom' : 'all')}
        onClose={() => setPeriodOpen(false)}
        onSelect={(value) => {
          const period = periods.find((item) => item.startDate === value);
          if (value === 'custom') setCustomOpen(true);
          else apply({ ...filters, startDate: period?.startDate ?? '', endDate: period?.endDate ?? '' });
        }}
      />
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
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: 4 },
});
