import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowRight, KeyRound, Receipt } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/empty-state';
import { useSmsIngestion } from '../../lib/sms-ingestion';
import { ScreenHeader } from '../../components/screen-header';
import {
  Button,
  InlineError,
  Panel,
  SectionHeader,
  Skeleton,
  TextLink,
  type Tone,
  type,
} from '../../components/ui';
import {
  ApiError,
  fetchCategorySpending,
  fetchRecentTransactions,
  fetchSummary,
  type CategorySpend,
  type Credentials,
  type DashboardSummary,
  type Transaction,
} from '../../lib/api';
import { useCredentials } from '../../lib/credentials';
import { formatCurrency, formatPercent, getMonthToDate, type MonthToDate } from '../../lib/format';
import { colors, fonts, radii } from '../../theme';

import { TransactionRow } from '../../components/transaction-row';
import { queryKeys } from '../../lib/query-keys';

const RECENT_COUNT = 5;
const CATEGORY_TILES = 4;
const categoryTones: Tone[] = ['mint', 'lilac', 'blush', 'paper'];

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong while loading this section.';
}

export default function OverviewScreen() {
  const { state } = useCredentials();

  if (state.status !== 'ready') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader section="Overview" />
        {state.status === 'missing' ? (
          <View style={styles.content}>
            <ConnectCard />
          </View>
        ) : null}
      </SafeAreaView>
    );
  }
  return <Overview credentials={state.credentials} />;
}

function Overview({ credentials }: { credentials: Credentials }) {
  const sms = useSmsIngestion();
  const importing = sms.enabled && !sms.authError;
  // Recomputed on each refresh so the month rolls over while the app stays open.
  const [now, setNow] = useState(() => new Date());
  const month = useMemo(() => getMonthToDate(now), [now]);
  // Settings clears the query cache on every sign-in and sign-out, so the URL is enough to key data.
  const monthRange = { startDate: month.startDate, endDate: month.endDate };

  const summary = useQuery({
    queryKey: queryKeys.summary(credentials.apiUrl, monthRange),
    queryFn: ({ signal }) => fetchSummary(credentials, monthRange, signal),
  });
  const previous = useQuery({
    queryKey: queryKeys.summary(credentials.apiUrl, {
      startDate: month.previousStartDate,
      endDate: month.previousEndDate,
    }),
    queryFn: ({ signal }) =>
      fetchSummary(
        credentials,
        { startDate: month.previousStartDate, endDate: month.previousEndDate },
        signal,
      ),
  });
  const allTime = useQuery({
    queryKey: queryKeys.summary(credentials.apiUrl),
    queryFn: ({ signal }) => fetchSummary(credentials, undefined, signal),
  });
  const categories = useQuery({
    queryKey: queryKeys.categorySpending(credentials.apiUrl, monthRange),
    queryFn: ({ signal }) => fetchCategorySpending(credentials, monthRange, signal),
  });
  const recent = useQuery({
    queryKey: queryKeys.transactions(credentials.apiUrl, {
      page: 1,
      size: RECENT_COUNT,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    }),
    queryFn: ({ signal }) => fetchRecentTransactions(credentials, RECENT_COUNT, signal),
  });

  const [refreshing, setRefreshing] = useState(false);
  async function refresh() {
    setRefreshing(true);
    setNow(new Date());
    await Promise.allSettled([
      summary.refetch(),
      previous.refetch(),
      allTime.refetch(),
      categories.refetch(),
      recent.refetch(),
    ]);
    setRefreshing(false);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader section="Overview" reviewCount={allTime.data?.uncategorizedCount} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[colors.foreground]}
          />
        }
      >
        <Text style={type.note}>spent so far this month</Text>
        <Button label="Add expense" variant="secondary" onPress={() => router.push('/transactions/new')} />

        {summary.isPending ? (
          <Skeleton height={206} />
        ) : summary.isError ? (
          <InlineError message={errorMessage(summary.error)} onRetry={() => void summary.refetch()} />
        ) : (
          <>
            <SpendCard month={month} summary={summary.data} previous={previous.data} />
            {allTime.data ? (
              <EmptyState
                title={
                  allTime.data.uncategorizedCount > 0
                    ? `${allTime.data.uncategorizedCount} to review`
                    : allTime.data.transactionCount > 0
                      ? 'You’re all caught up'
                      : importing
                        ? 'Waiting for your first bank debit'
                        : 'Auto-import is off'
                }
                message={
                  allTime.data.uncategorizedCount > 0
                    ? 'Give uncategorized expenses a category.'
                    : allTime.data.transactionCount > 0
                      ? 'Every transaction has a category. Add your next expense whenever you need.'
                      : importing
                        ? 'New supported bank debits will appear here automatically. Past SMS are not imported.'
                        : 'Add expenses manually, or turn on SMS import by running setup again in Settings.'
                }
                action={
                  allTime.data.uncategorizedCount > 0
                    ? { label: 'Review now', onPress: () => router.push('/review') }
                    : { label: 'Add expense', onPress: () => router.push('/transactions/new') }
                }
              />
            ) : null}
          </>
        )}

        <SectionHeader
          title="Where it went"
          right={
            categories.data && categories.data.length > CATEGORY_TILES ? (
              <Text style={type.label}>
                Top {CATEGORY_TILES} of {categories.data.length}
              </Text>
            ) : null
          }
        />
        {categories.isPending ? (
          <View style={styles.grid}>
            {Array.from({ length: CATEGORY_TILES }, (_, index) => (
              <Skeleton key={index} height={112} style={styles.tile} />
            ))}
          </View>
        ) : categories.isError ? (
          <InlineError message={errorMessage(categories.error)} onRetry={() => void categories.refetch()} />
        ) : (
          <CategoryGrid categories={categories.data} />
        )}

        <SectionHeader
          title="Recent transactions"
          right={<TextLink label="See all" onPress={() => router.navigate('/(tabs)/transactions')} />}
        />
        {recent.isPending ? (
          <Skeleton height={RECENT_COUNT * 76} />
        ) : recent.isError ? (
          <InlineError message={errorMessage(recent.error)} onRetry={() => void recent.refetch()} />
        ) : (
          <RecentList transactions={recent.data} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectCard() {
  return (
    <Panel raised style={styles.cardPadding}>
      <View style={styles.row}>
        <KeyRound size={20} color={colors.foreground} />
        <Text style={type.heading}>Connect TrackCrow</Text>
      </View>
      <Text style={type.muted}>Sign in with Google in Settings to see your spending here.</Text>
      <Button label="Open settings" trailingIcon={ArrowRight} onPress={() => router.navigate('/settings')} />
    </Panel>
  );
}

function SpendCard({
  month,
  summary,
  previous,
}: {
  month: MonthToDate;
  summary: DashboardSummary;
  previous: DashboardSummary | undefined;
}) {
  const sortedShare = summary.transactionCount > 0 ? summary.categorizedCount / summary.transactionCount : 0;
  const count = summary.transactionCount;
  return (
    <Panel raised style={styles.cardPadding}>
      <Text style={type.label}>Spent in {month.monthName}</Text>
      <Text
        style={[type.number, styles.total]}
        accessibilityLabel={`${formatCurrency(summary.totalSpend)} spent in ${month.monthName}`}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {formatCurrency(summary.totalSpend)}
      </Text>
      <Text style={type.muted}>
        {count} {count === 1 ? 'transaction' : 'transactions'}
        {count > 0 ? ` · ${formatCurrency(summary.averageSpend)} average` : ''}
      </Text>
      <Comparison current={summary.totalSpend} previous={previous?.totalSpend} />

      <View style={styles.divider} />
      <View style={styles.rowBetween}>
        <Text style={type.body}>
          {summary.categorizedCount} of {count} sorted
        </Text>
        <Text style={[type.number, styles.small]}>{Math.round(sortedShare * 100)}%</Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: count, now: summary.categorizedCount }}
      >
        <View style={[styles.progressFill, { width: `${sortedShare * 100}%` }]} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={type.label}>{month.label}</Text>
        <Text style={[type.label, styles.daysLeft]}>
          {month.daysLeft === 0
            ? 'Last day'
            : `${month.daysLeft} ${month.daysLeft === 1 ? 'day' : 'days'} left`}
        </Text>
      </View>
    </Panel>
  );
}

function Comparison({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined || previous <= 0) return null;
  const difference = Math.round(current - previous);
  if (difference === 0) return <Text style={type.body}>Same as this time last month</Text>;
  const more = difference > 0;
  return (
    <Text style={type.body}>
      <Text style={[styles.comparisonAmount, { color: more ? colors.destructiveInk : colors.primaryInk }]}>
        {formatCurrency(Math.abs(difference))} {more ? 'more' : 'less'}
      </Text>{' '}
      than this time last month
    </Text>
  );
}

function CategoryGrid({ categories }: { categories: CategorySpend[] }) {
  if (categories.length === 0) {
    return (
      <Panel style={[styles.cardPadding, styles.row]}>
        <Receipt size={20} color={colors.secondaryForeground} />
        <Text style={[type.muted, styles.flex]}>No spending yet this month.</Text>
      </Panel>
    );
  }
  const total = categories.reduce((sum, item) => sum + item.totalSpend, 0);
  const top = [...categories].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, CATEGORY_TILES);
  let toneIndex = 0;
  return (
    <View style={styles.grid}>
      {top.map((item) => {
        const uncategorized = item.category === 'Uncategorized';
        const tone = uncategorized ? 'paper' : categoryTones[toneIndex++ % categoryTones.length];
        return (
          <Panel
            key={item.category}
            tone={tone}
            style={[styles.tile, uncategorized && { backgroundColor: colors.uncategorized }]}
          >
            <Text style={type.label} numberOfLines={2}>
              {item.category}
            </Text>
            <Text style={[type.number, styles.tileAmount]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(item.totalSpend)}
            </Text>
            <Text style={[type.muted, styles.tabular]}>
              {formatPercent(item.totalSpend, total)} · {item.transactionCount}{' '}
              {item.transactionCount === 1 ? 'txn' : 'txns'}
            </Text>
          </Panel>
        );
      })}
    </View>
  );
}

function RecentList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Panel style={[styles.cardPadding, styles.row]}>
        <Receipt size={20} color={colors.secondaryForeground} />
        <Text style={[type.muted, styles.flex]}>No transactions yet.</Text>
      </Panel>
    );
  }
  return (
    <Panel raised>
      {transactions.map((transaction, index) => (
        <TransactionRow
          key={transaction.uuid}
          transaction={transaction}
          divider={index > 0}
          onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: transaction.uuid } })}
        />
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  cardPadding: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  total: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 52 },
  small: { fontSize: 14 },
  comparisonAmount: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.25, marginVertical: 4 },
  progressTrack: {
    height: 14,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  daysLeft: { color: colors.primaryInk },
  reviewHelper: { color: colors.secondaryForeground },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '46%', flexGrow: 1, padding: 14, gap: 6, minHeight: 112 },
  tileAmount: { fontSize: 24, lineHeight: 30, marginTop: 'auto' },
});
