import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { RecipientFilterSheet } from '../../components/recipients/filter-sheet';
import { LedgerPage } from '../../components/recipients/shared';
import { TextField } from '../../components/text-field';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipients, type RecipientFilters } from '../../lib/api/recipients';
import { formatCurrency } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { emptyRecipientBounds, parseRecipientBounds } from '../../lib/recipient-filters';

export default function RecipientsScreen() {
  return <TransactionSession>{c => <Recipients credentials={c} />}</TransactionSession>;
}
function Recipients({ credentials: c }: { credentials: Credentials }) {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [sortBy, setSort] = useState<RecipientFilters['sortBy']>('displayName');
  const [sortOrder, setOrder] = useState<'asc' | 'desc'>('asc');
  const [bounds, setBounds] = useState({ ...emptyRecipientBounds });
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const filters = { q, sortBy, sortOrder, size: 30, ...parseRecipientBounds(bounds).filters };
  const query = useInfiniteQuery({
    queryKey: queryKeys.recipients(c.apiUrl, filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchRecipients(c, { ...filters, page: pageParam }, signal),
    getNextPageParam: page => page.hasNext ? page.page + 1 : undefined,
  });
  return <LedgerPage title="Recipients">
    <FlashList key={JSON.stringify(filters)}
      data={query.data?.pages.flatMap(page => page.recipients) ?? []}
      keyExtractor={item => item.uuid}
      keyboardShouldPersistTaps="handled"
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      onEndReached={() => { if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage(); }}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={<View style={{ padding: 16, gap: 12 }}>
        <TextField label="Search recipients" placeholder="Name, alias or note" value={search} onChangeText={setSearch} />
        <Button label={Object.values(bounds).some(Boolean) ? 'Filters · Active' : 'Filters'}
          variant="secondary" onPress={() => setFilterOpen(true)} />
        <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
          {([['displayName', 'Name'], ['transactionCount', 'Count'], ['totalAmount', 'Total']] as const)
            .map(([key, label]) => <Button key={key} label={sortBy === key ? `✓ ${label}` : label}
              variant="secondary" onPress={() => { setSort(key); setOrder(key === 'displayName' ? 'asc' : 'desc'); }} />)}
          <Button label={sortOrder === 'asc' ? 'Ascending' : 'Descending'} variant="secondary"
            onPress={() => setOrder(sortOrder === 'asc' ? 'desc' : 'asc')} />
        </ScrollView>
        {query.data ? <Text style={type.muted}>{query.data.pages[0].total} recipients</Text> : null}
        {query.isPending ? <Skeleton height={100} /> : null}
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button"
        accessibilityLabel={`${item.displayName}, ${item.transactionCount} transactions, ${formatCurrency(item.totalAmount)}`}
        onPress={() => router.push({ pathname: '/recipients/[id]', params: { id: item.uuid } })}>
        <Panel style={{ marginHorizontal: 16, marginBottom: 10, padding: 14, gap: 8 }}>
          <Text style={type.heading}>{item.displayName}</Text>
          <Text style={type.body}>{item.transactionCount} transactions · {formatCurrency(item.totalAmount)}</Text>
          {item.note ? <Text numberOfLines={2} style={type.muted}>{item.note}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {item.aliases.map(alias => <Chip key={alias.uuid} label={alias.value} />)}
          </View>
        </Panel>
      </Pressable>}
      ListEmptyComponent={query.isSuccess ? <View style={{ padding: 16 }}><EmptyState
        title="No recipients" message="Try another search or clear your filters." /></View> : null}
      ListFooterComponent={<View style={{ padding: 16, gap: 12 }}>
        {query.isError ? <InlineError message={errorMessage(query.error)}
          onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())} /> : null}
        {query.hasNextPage ? <Button label={query.isFetchingNextPage ? 'Loading…' : 'Load more recipients'}
          variant="secondary" disabled={query.isFetching} onPress={() => void query.fetchNextPage()} /> : null}
      </View>} />
    {filterOpen ? <RecipientFilterSheet value={bounds} onApply={setBounds} onClose={() => setFilterOpen(false)} /> : null}
  </LedgerPage>;
}
