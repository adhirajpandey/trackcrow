import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { useReviewQueue } from '../../components/transactions/review-queue';
import { TransactionPage, TransactionSession, errorMessage } from '../../components/transactions/shared';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import type { Credentials } from '../../lib/api/client';
import type { Transaction } from '../../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../../lib/format';
import { decodeFilters } from '../../lib/transaction-filters';
import { colors, fonts } from '../../theme';

export default function ReviewScreen() {
  const { startDate, endDate } = decodeFilters(useLocalSearchParams());
  return (
    <TransactionSession>
      {(credentials) => <ReviewList credentials={credentials} startDate={startDate} endDate={endDate} />}
    </TransactionSession>
  );
}

function ReviewList({
  credentials: c,
  startDate,
  endDate,
}: {
  credentials: Credentials;
  startDate?: string;
  endDate?: string;
}) {
  const { query, rows, total } = useReviewQueue(c, startDate, endDate);
  const dates = startDate && endDate ? { startDate, endDate } : {};
  return (
    <TransactionPage title="Transactions" heading="Review">
      <Text style={type.muted}>
        {query.isPending
          ? 'Loading…'
          : `${total} ${total === 1 ? 'transaction needs' : 'transactions need'} your attention`}
        {startDate ? ` · ${startDate} to ${endDate} IST` : ''}
      </Text>
      {query.isPending ? (
        <Skeleton height={240} />
      ) : query.isError ? (
        <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : rows.length ? (
        rows.map((txn, index) => (
          <ReviewRow
            key={txn.uuid}
            index={index}
            transaction={txn}
            onPress={() => router.push({ pathname: '/review/[id]', params: { id: txn.uuid, ...dates } })}
          />
        ))
      ) : (
        <EmptyState title="You're all caught up." message="New uncategorized transactions will appear here." />
      )}
      {query.hasNextPage ? (
        <Button
          label={query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          variant="secondary"
          disabled={query.isFetching}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </TransactionPage>
  );
}

function ReviewRow({
  transaction: txn,
  index,
  onPress,
}: {
  transaction: Transaction;
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${txn.recipientDisplayName}, ${formatCurrency(txn.amount)}, ${txn.type}, ${formatTransactionTime(txn.timestamp)}, uncategorized`}
      testID={`review-row-${index}`}
      onPress={onPress}
    >
      <Panel style={styles.row}>
        <View style={styles.text}>
          <View style={styles.top}>
            <Text style={styles.recipient} numberOfLines={1}>
              {txn.recipientDisplayName}
            </Text>
            <Text style={[type.number, styles.amount]}>{formatCurrency(txn.amount)}</Text>
          </View>
          <Text style={type.muted}>
            {txn.type} · {formatTransactionTime(txn.timestamp)}
          </Text>
          <View style={styles.tag}>
            <Chip label="Uncategorized" tone="uncategorized" />
          </View>
        </View>
        <ChevronRight size={18} color={colors.foreground} />
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  text: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recipient: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  amount: { fontSize: 16 },
  tag: { flexDirection: 'row' },
});
