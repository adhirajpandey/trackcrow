import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createRecipient, fetchRecipients } from '../../lib/api/recipients';
import { fetchRecentTransactions } from '../../lib/api/transactions';
import type { Credentials } from '../../lib/api/client';
import { queryKeys } from '../../lib/query-keys';
import { MenuRow } from '../menu-row';
import { SearchField } from '../search-field';
import { Sheet } from '../sheet';
import { Button, InlineError, type } from '../ui';
import { colors, fonts, radii } from '../../theme';
import { errorMessage } from './shared';
export type SelectedRecipient = { uuid: string; displayName: string };
export function RecipientPicker({
  credentials: c,
  onSelect,
  onClose,
}: {
  credentials: Credentials;
  onSelect: (recipient: SelectedRecipient) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState(''),
    [debounced, setDebounced] = useState('');
  const client = useQueryClient();
  const [open, setOpen] = useState(true);
  const picked = useRef<SelectedRecipient | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.recipients(c.apiUrl, { q: debounced, size: 30 }), 'picker'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchRecipients(c, { q: debounced, page: pageParam, size: 30 }, signal),
    getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
  });
  const recent = useQuery({
    queryKey: [...queryKeys.transactions(c.apiUrl), 'recent-recipients'],
    queryFn: ({ signal }) => fetchRecentTransactions(c, 30, signal),
  });
  const recentRecipients = [
    ...new Map(
      (recent.data ?? []).map((txn) => [
        txn.recipientUuid,
        { uuid: txn.recipientUuid, displayName: txn.recipientDisplayName },
      ]),
    ).values(),
  ].slice(0, 6);
  const create = useMutation({
    mutationFn: () => createRecipient(c, search.trim()),
    onSuccess: (recipient) => {
      void client.invalidateQueries({ queryKey: queryKeys.recipients(c.apiUrl) });
      select(recipient);
    },
  });
  function select(recipient: SelectedRecipient) {
    picked.current = recipient;
    setOpen(false);
  }
  const results = query.data?.pages.flatMap((page) => page.recipients) ?? [];
  return (
    <Sheet
      open={open}
      title="Recipient"
      onClose={() => {
        if (picked.current) onSelect(picked.current);
        onClose();
      }}
    >
      <SearchField
        inSheet
        label="Search or create recipient"
        placeholder="Search or create recipient"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {search.trim() ? (
          <MenuRow
            icon={Plus}
            label={create.isPending ? 'Creating…' : `Create “${search.trim()}”`}
            description="Add as a new recipient"
            tone={colors.paperMint}
            onPress={create.isPending ? undefined : () => create.mutate()}
          />
        ) : null}
        {create.isError ? (
          <Text accessibilityRole="alert" style={type.error}>
            {errorMessage(create.error)}
          </Text>
        ) : null}
        {!search && recentRecipients.length ? (
          <>
            <Text style={type.label}>Recent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {recentRecipients.map((item) => (
                <Pressable
                  key={item.uuid}
                  accessibilityRole="button"
                  accessibilityLabel={`Recent recipient ${item.displayName}`}
                  onPress={() => select(item)}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={type.label}>All recipients</Text>
          </>
        ) : null}
        {query.isPending ? <Text style={type.muted}>Loading recipients…</Text> : null}
        {query.isError ? (
          <InlineError
            message={errorMessage(query.error)}
            onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
          />
        ) : null}
        {query.isSuccess && !results.length && !search.trim() ? (
          <Text style={type.muted}>No recipients yet. Type a name to create one.</Text>
        ) : null}
        {results.map((recipient) => (
          <Pressable
            key={recipient.uuid}
            accessibilityRole="button"
            accessibilityLabel={`${recipient.displayName}, ${recipient.transactionCount} transactions`}
            disabled={create.isPending}
            onPress={() => select(recipient)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>
                {recipient.displayName}
              </Text>
              <Text style={type.muted}>
                {recipient.transactionCount} {recipient.transactionCount === 1 ? 'transaction' : 'transactions'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.foreground} />
          </Pressable>
        ))}
        {query.hasNextPage ? (
          <Button
            label={query.isFetchingNextPage ? 'Loading…' : 'Load more'}
            variant="secondary"
            compact
            disabled={query.isFetching}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
      </BottomSheetScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, paddingBottom: 24 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.paperMint,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.foreground, maxWidth: 180 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.7 },
  flex: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
});
