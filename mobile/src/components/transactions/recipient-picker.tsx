import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { createRecipient, fetchRecipients } from '../../lib/api/recipients';
import { fetchRecentTransactions } from '../../lib/api/transactions';
import type { Credentials } from '../../lib/api/client';
import { queryKeys } from '../../lib/query-keys';
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
      onSelect(recipient);
      onClose();
    },
  });
  function select(recipient: SelectedRecipient) {
    onSelect(recipient);
    onClose();
  }
  return (
    <Sheet open title="Recipient" onClose={onClose}>
      <BottomSheetTextInput
        accessibilityLabel="Search or create recipient"
        placeholder="Search or create recipient"
        placeholderTextColor={colors.mutedForeground}
        value={search}
        onChangeText={setSearch}
        style={{
          minHeight: 48,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: 12,
          fontFamily: fonts.regular,
          color: colors.foreground,
        }}
      />
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
      >
        {!search && recentRecipients.length ? (
          <>
            <Text style={type.label}>Recent recipients</Text>
            <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {recentRecipients.map((item) => (
                <Button
                  key={item.uuid}
                  label={item.displayName}
                  variant="secondary"
                  onPress={() => select(item)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
        {query.isPending ? <Text style={type.muted}>Loading recipients…</Text> : null}
        {query.isError ? (
          <InlineError
            message={errorMessage(query.error)}
            onRetry={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())}
          />
        ) : null}
        {query.data?.pages
          .flatMap((page) => page.recipients)
          .map((recipient) => (
            <Button
              key={recipient.uuid}
              label={recipient.displayName}
              variant="secondary"
              disabled={create.isPending}
              onPress={() => select(recipient)}
            />
          ))}
        {query.hasNextPage ? (
          <Button
            label={query.isFetchingNextPage ? 'Loading…' : 'Load more recipients'}
            variant="secondary"
            disabled={query.isFetching}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
        {search.trim() ? (
          <Button
            label={create.isPending ? 'Creating…' : `Create “${search.trim()}”`}
            disabled={create.isPending}
            onPress={() => create.mutate()}
          />
        ) : null}
        {create.isError ? (
          <Text accessibilityRole="alert" style={type.error}>
            {errorMessage(create.error)}
          </Text>
        ) : null}
      </BottomSheetScrollView>
    </Sheet>
  );
}
