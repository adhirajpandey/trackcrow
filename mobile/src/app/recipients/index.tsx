import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { FilterButton } from '../../components/filter-button';
import { RecipientFilterSheet, defaultRecipientOptions } from '../../components/recipients/filter-sheet';
import { LedgerPage } from '../../components/recipients/shared';
import { SearchField } from '../../components/search-field';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipients, type Recipient } from '../../lib/api/recipients';
import { formatCurrency } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { parseRecipientBounds } from '../../lib/recipient-filters';
import { colors, fonts } from '../../theme';

export default function RecipientsScreen() {
  return <TransactionSession>{(c) => <Recipients credentials={c} />}</TransactionSession>;
}

function Recipients({ credentials: c }: { credentials: Credentials }) {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [options, setOptions] = useState(defaultRecipientOptions);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const { bounds, sortBy, sortOrder } = options;
  const filters = { q, sortBy, sortOrder, size: 30, ...parseRecipientBounds(bounds).filters };
  const filtered =
    Object.values(bounds).some(Boolean) ||
    sortBy !== defaultRecipientOptions.sortBy ||
    sortOrder !== defaultRecipientOptions.sortOrder;
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
            <View style={styles.controls}>
              <View style={styles.search}>
                <SearchField
                  label="Search recipients"
                  placeholder="Name, alias or note"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
              </View>
              <FilterButton active={filtered} onPress={() => setFilterOpen(true)} />
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
      {filterOpen ? (
        <RecipientFilterSheet
          value={options}
          onApply={(next) => {
            setOptions(next);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
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
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1 },
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
