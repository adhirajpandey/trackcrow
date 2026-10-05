import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight, Funnel } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { SelectRow } from '../../components/form-controls';
import { RecipientFilterSheet } from '../../components/recipients/filter-sheet';
import { LedgerPage } from '../../components/recipients/shared';
import { SearchField } from '../../components/search-field';
import { SelectSheet } from '../../components/select-sheet';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipients, type Recipient, type RecipientFilters } from '../../lib/api/recipients';
import { formatCurrency } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { emptyRecipientBounds, parseRecipientBounds } from '../../lib/recipient-filters';
import { colors, fonts } from '../../theme';

const sorts = [
  { value: 'displayName:asc', label: 'Name (A–Z)', short: 'name' },
  { value: 'displayName:desc', label: 'Name (Z–A)', short: 'name, Z–A' },
  { value: 'totalAmount:desc', label: 'Total paid (highest first)', short: 'total' },
  { value: 'totalAmount:asc', label: 'Total paid (lowest first)', short: 'total, lowest' },
  { value: 'transactionCount:desc', label: 'Transactions (most first)', short: 'count' },
  { value: 'transactionCount:asc', label: 'Transactions (fewest first)', short: 'count, fewest' },
];

export default function RecipientsScreen() {
  return <TransactionSession>{(c) => <Recipients credentials={c} />}</TransactionSession>;
}

function Recipients({ credentials: c }: { credentials: Credentials }) {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [sort, setSort] = useState('displayName:asc');
  const [bounds, setBounds] = useState({ ...emptyRecipientBounds });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [sortBy, sortOrder] = sort.split(':') as [RecipientFilters['sortBy'], 'asc' | 'desc'];
  const filters = { q, sortBy, sortOrder, size: 30, ...parseRecipientBounds(bounds).filters };
  const filtered = Object.values(bounds).some(Boolean);
  const query = useInfiniteQuery({
    queryKey: queryKeys.recipients(c.apiUrl, filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchRecipients(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
  });
  return (
    <LedgerPage title="Recipients" heading="Recipients">
      <FlashList
        key={JSON.stringify(filters)}
        data={query.data?.pages.flatMap((page) => page.recipients) ?? []}
        keyExtractor={(item) => item.uuid}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField
              label="Search recipients"
              placeholder="Name, alias or note"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <View style={styles.controls}>
              <View style={styles.control}>
                <SelectRow
                  label="Sort"
                  chevron="down"
                  value={`Sort by ${sorts.find((item) => item.value === sort)?.short}`}
                  placeholder="Sort"
                  onPress={() => setSortOpen(true)}
                />
              </View>
              <View style={styles.control}>
                <SelectRow
                  label="Filters"
                  icon={Funnel}
                  chevron="down"
                  value={filtered ? 'Filters · On' : 'Filters'}
                  placeholder="Filters"
                  chosen={filtered}
                  onPress={() => setFilterOpen(true)}
                />
              </View>
            </View>
            {query.data ? (
              <Text style={type.muted}>
                {query.data.pages[0].total} {query.data.pages[0].total === 1 ? 'recipient' : 'recipients'}
              </Text>
            ) : null}
            {query.isPending ? <Skeleton height={100} /> : null}
          </View>
        }
        renderItem={({ item }) => <RecipientRow recipient={item} />}
        ListEmptyComponent={
          query.isSuccess ? (
            <View style={styles.padded}>
              <EmptyState title="No recipients" message="Try another search or clear your filters." />
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {query.isError ? (
              <InlineError
                message={errorMessage(query.error)}
                onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
              />
            ) : null}
            {query.hasNextPage ? (
              <Button
                label={query.isFetchingNextPage ? 'Loading…' : 'Load more recipients'}
                variant="secondary"
                disabled={query.isFetching}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null}
          </View>
        }
      />
      <SelectSheet
        open={sortOpen}
        title="Sort recipients"
        searchable={false}
        options={sorts}
        selected={sort}
        onSelect={setSort}
        onClose={() => setSortOpen(false)}
      />
      {filterOpen ? (
        <RecipientFilterSheet value={bounds} onApply={setBounds} onClose={() => setFilterOpen(false)} />
      ) : null}
    </LedgerPage>
  );
}

function RecipientRow({ recipient: item }: { recipient: Recipient }) {
  const [alias, ...more] = item.aliases.filter(
    (entry) => entry.value.toLocaleLowerCase() !== item.displayName.toLocaleLowerCase(),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.displayName}, ${item.transactionCount} transactions, ${formatCurrency(item.totalAmount)} total paid`}
      onPress={() => router.push({ pathname: '/recipients/[id]', params: { id: item.uuid } })}
    >
      <Panel style={styles.row}>
        <View style={styles.rowText}>
          <View style={styles.line}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName}
            </Text>
            <Text style={[type.number, styles.amount]}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={[type.muted, styles.flex]}>
              {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
            </Text>
            <Text style={type.muted}>Total paid</Text>
          </View>
          {alias ? (
            <View style={styles.aliases}>
              <Chip label={alias.value} />
              {more.length ? <Text style={type.muted}>+{more.length}</Text> : null}
            </View>
          ) : null}
        </View>
        <ChevronRight size={18} color={colors.foreground} />
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 12 },
  controls: { flexDirection: 'row', gap: 8 },
  control: { flex: 1 },
  padded: { padding: 16 },
  footer: { padding: 16, gap: 12 },
  row: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowText: { flex: 1, gap: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.foreground },
  amount: { fontSize: 16 },
  flex: { flex: 1 },
  aliases: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
});
