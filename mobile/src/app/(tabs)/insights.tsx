import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { EmptyState } from '../../components/empty-state';
import { SelectRow } from '../../components/form-controls';
import { SelectSheet } from '../../components/select-sheet';
import { CategoryBars, SpendingBreakdown, SpendingChart } from '../../components/insights/charts';
import { LedgerRow } from '../../components/transactions/ledger-row';
import { PeriodRangeSheet } from '../../components/transactions/period-range-sheet';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import { InlineError, Panel, SectionHeader, Skeleton, TextLink, type } from '../../components/ui';
import type { Credentials } from '../../lib/api/client';
import { fetchSummary, fetchCategorySpending, fetchPeriodSpending } from '../../lib/api/dashboard';
import { fetchTransactions } from '../../lib/api/transactions';
import { formatCurrency } from '../../lib/format';
import {
  insightPeriods,
  insightRange,
  previousInsightRange,
  insightGranularity,
  trendBuckets,
  rangeDays,
  type InsightPeriod,
  type DayRange,
} from '../../lib/insights-ranges';
import { queryKeys } from '../../lib/query-keys';
import { readCachedSmsConfig } from '../../lib/sms-config';
import { dateRange, dayLabel, istDateKey } from '../../lib/transaction-dates';
import { encodeFilters } from '../../lib/transaction-filters';
import { colors } from '../../theme';
import { useToast } from '../../components/toast-host';

export default function InsightsScreen() {
  return <TransactionSession>{(credentials) => <Insights credentials={credentials} />}</TransactionSession>;
}
function Section({
  title,
  query,
  children,
  height = 180,
  right,
}: {
  title: string;
  right?: ReactNode;
  query: { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  children: ReactNode;
  height?: number;
}) {
  return (
    <View style={{ gap: 10 }}>
      <SectionHeader title={title} right={right} />
      {query.isPending ? (
        <Skeleton height={height} />
      ) : query.isError ? (
        <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        children
      )}
    </View>
  );
}
function Insights({ credentials: c }: { credentials: Credentials }) {
  const toast = useToast();
  const [period, setPeriod] = useState<InsightPeriod>('this-month');
  const [custom, setCustom] = useState<DayRange>();
  const [customOpen, setCustomOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const days = insightRange(period, new Date(), custom);
  const range = dateRange(days.startDate, days.endDate)!;
  const previousDays = previousInsightRange(period, days);
  const previousRange = dateRange(previousDays.startDate, previousDays.endDate)!;
  const granularity = insightGranularity(days);
  const summary = useQuery({
    queryKey: queryKeys.summary(c.apiUrl, range),
    queryFn: ({ signal }) => fetchSummary(c, range, signal),
  });
  const previous = useQuery({
    queryKey: queryKeys.summary(c.apiUrl, previousRange),
    queryFn: ({ signal }) => fetchSummary(c, previousRange, signal),
  });
  const categories = useQuery({
    queryKey: queryKeys.categorySpending(c.apiUrl, range),
    queryFn: ({ signal }) => fetchCategorySpending(c, range, signal),
  });
  const trend = useQuery({
    queryKey: queryKeys.periodSpending(c.apiUrl, range, granularity),
    queryFn: ({ signal }) => fetchPeriodSpending(c, range, granularity, signal),
  });
  const filters = { ...days, size: 5, sortBy: 'amount' as const, sortOrder: 'desc' as const };
  const largest = useQuery({
    queryKey: queryKeys.transactions(c.apiUrl, filters),
    // Transactions accepts IST date keys; dashboard endpoints accept ISO timestamps.
    queryFn: ({ signal }) => fetchTransactions(c, filters, signal),
  });
  const banks = useQuery({
    queryKey: ['sms-coverage', c.apiUrl],
    queryFn: () => readCachedSmsConfig(c.apiUrl),
  });
  function openTransactions(selected = days, category?: string, recipientUuid?: string) {
    router.navigate({
      pathname: '/(tabs)/transactions',
      params: encodeFilters({
        ...selected,
        ...(category ? { category: [category] } : {}),
        ...(recipientUuid ? { recipientUuid } : {}),
        sortBy: 'amount',
        sortOrder: 'desc',
      }),
    });
  }
  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        summary.refetch(),
        previous.refetch(),
        categories.refetch(),
        trend.refetch(),
        largest.refetch(),
        banks.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }
  const total = summary.data?.totalSpend ?? 0;
  const previousTotal = previous.data?.totalSpend ?? 0;
  const change = total - previousTotal;
  const buckets = trendBuckets(days, granularity, trend.data ?? []);
  const cadence = granularity === 'day' ? 'Daily' : granularity === 'week' ? 'Weekly' : 'Monthly';
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Insights" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <SelectRow
          label="Period"
          icon={Calendar}
          chevron="down"
          value={
            period === 'custom'
              ? `${dayLabel(days.startDate)} – ${dayLabel(days.endDate)}`
              : insightPeriods.find(([value]) => value === period)?.[1]
          }
          placeholder="This month"
          chosen={period !== 'this-month'}
          onPress={() => setPeriodOpen(true)}
        />
        <Text style={type.muted}>
          {dayLabel(days.startDate)} – {dayLabel(days.endDate)} · IST
        </Text>
        <Section title="Spending in this period" query={summary} height={190}>
          <Panel tone="mint" raised style={{ padding: 16, gap: 10 }}>
            <Text style={[type.number, { fontSize: 36 }]}>{formatCurrency(total)}</Text>
            <Text style={type.body}>{summary.data?.transactionCount ?? 0} transactions</Text>
            {previous.isPending ? (
              <Skeleton height={44} />
            ) : previous.isError ? (
              <InlineError message={errorMessage(previous.error)} onRetry={() => void previous.refetch()} />
            ) : (
              <>
                <Text style={type.body}>
                  {previousTotal > 0
                    ? `${Math.abs((change / previousTotal) * 100).toFixed(1)}% ${change > 0 ? 'more' : change < 0 ? 'less' : 'change'} (${formatCurrency(Math.abs(change))})`
                    : total > 0
                      ? `${formatCurrency(total)} more; no spending in the previous period`
                      : 'No spending in either period'}{' '}
                  compared with{' '}
                  {period === 'this-month' ? 'the same days last month.' : 'the previous period.'}
                </Text>
                <Text style={type.muted}>
                  {dayLabel(previousDays.startDate)} – {dayLabel(previousDays.endDate)}
                </Text>
              </>
            )}
            <Text style={type.muted}>Based on {banks.data ?? 'Kotak, HDFC'} and manual transactions</Text>
          </Panel>
        </Section>
        <Section title="Where it went" query={categories}>
          {categories.data?.length ? (
            <CategoryBars
              spending={categories.data}
              onSelect={(category) =>
                category === 'Uncategorized'
                  ? router.push({ pathname: '/review', params: encodeFilters(days) })
                  : openTransactions(days, category)
              }
            />
          ) : (
            <EmptyState
              title="No category spending"
              message="Transactions in this period will appear here."
            />
          )}
        </Section>
        <Section title={`${cadence} spending`} query={trend} height={240}>
          {trend.data?.some((row) => row.transactionCount > 0) ? (
            <SpendingChart
              key={`${days.startDate}:${days.endDate}`}
              buckets={buckets}
              granularity={granularity}
              average={trend.data.reduce((sum, row) => sum + row.totalSpend, 0) / rangeDays(days)}
            />
          ) : (
            <EmptyState
              title="No spending yet"
              message="The trend will appear when this period has transactions."
            />
          )}
        </Section>
        {trend.data?.some((row) => row.transactionCount > 0) ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title={`${cadence} breakdown`} />
            <SpendingBreakdown buckets={buckets} granularity={granularity} onSelect={(bucket) => openTransactions(bucket)} />
          </View>
        ) : null}
        <Section
          title="Largest transactions"
          query={largest}
          height={360}
          right={<TextLink label="View all" onPress={() => openTransactions()} />}
        >
          {largest.data?.transactions.length ? (
            largest.data.transactions.map((txn) => (
              <Pressable
                key={txn.uuid}
                accessibilityRole="button"
                accessibilityLabel={`${txn.recipientDisplayName}, ${formatCurrency(txn.amount)}, ${txn.category ?? 'Uncategorized'}, ${dayLabel(istDateKey(txn.timestamp))}. Open this recipient's Transactions for the selected period.`}
                onPress={() => openTransactions(days, undefined, txn.recipientUuid)}
              >
                <View
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{ marginHorizontal: -16, marginBottom: -10 }}
                >
                  <LedgerRow
                    transaction={txn}
                    disabled
                    showActions={false}
                    onClassify={() => undefined}
                    onIgnore={() => undefined}
                  />
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyState title="No transactions" message="Choose another period to explore your spending." />
          )}
        </Section>
      </ScrollView>
      <SelectSheet
        open={periodOpen}
        title="Period"
        searchable={false}
        options={insightPeriods.map(([value, label]) => ({
          value,
          label: value === 'custom' ? 'Custom range…' : label,
        }))}
        selected={period}
        onClose={() => setPeriodOpen(false)}
        onSelect={(value) =>
          value === 'custom' ? setCustomOpen(true) : setPeriod(value as InsightPeriod)
        }
      />
      {customOpen ? (
        <PeriodRangeSheet
          startDate={days.startDate}
          endDate={days.endDate}
          onClose={() => setCustomOpen(false)}
          onApply={(startDate, endDate) => {
            setCustomOpen(false);
            if (dateRange(startDate, endDate)) {
              setCustom({ startDate, endDate });
              setPeriod('custom');
            } else if (!startDate && !endDate && largest.data?.firstTxnDate) {
              const allDays = {
                startDate: istDateKey(largest.data.firstTxnDate),
                endDate: istDateKey(new Date()),
              };
              if (dateRange(allDays.startDate, allDays.endDate)) {
                setCustom(allDays);
                setPeriod('custom');
              }
            } else {
              toast({ message: 'Choose a start and end date for Insights.' });
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
