import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Clipboard, Text, View } from 'react-native';
import { AliasSheet } from '../../components/recipients/alias-sheet';
import { ApplyRecipientCategory } from '../../components/recipients/apply-category';
import { LedgerPage, useInvalidateRecipientsAndRules } from '../../components/recipients/shared';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { TextField } from '../../components/text-field';
import { useToast } from '../../components/toast-host';
import { IgnoreRecipient, useClassification } from '../../components/transactions/actions';
import { LedgerRow } from '../../components/transactions/ledger-row';
import { TransactionSession, errorMessage } from '../../components/transactions/shared';
import { Button, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { EmptyState } from '../../components/empty-state';
import type { Credentials } from '../../lib/api/client';
import { fetchCategories } from '../../lib/api/categories';
import { fetchRecipientDetail, updateRecipient, type RecipientDetail } from '../../lib/api/recipients';
import { fetchTransactions, type Transaction } from '../../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { recipientForm, reconcileRecipientForm } from '../../lib/recipient-draft';

export default function RecipientDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <TransactionSession>{c => <Detail key={id} credentials={c} id={id ?? ''} />}</TransactionSession>;
}
function Detail({ credentials: c, id }: { credentials: Credentials; id: string }) {
  const query = useQuery({
    queryKey: queryKeys.recipient(c.apiUrl, id),
    queryFn: ({ signal }) => fetchRecipientDetail(c, id, signal),
  });
  if (query.isPending) return <LedgerPage title="Recipient"><View style={{ padding: 16 }}><Skeleton height={200} /></View></LedgerPage>;
  if (query.isError) return <LedgerPage title="Recipient"><View style={{ padding: 16 }}>
    <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
  </View></LedgerPage>;
  return <RecipientEditor credentials={c} recipient={query.data} />;
}
function RecipientEditor({ credentials: c, recipient }: { credentials: Credentials; recipient: RecipientDetail }) {
  const [form, setForm] = useState(() => recipientForm(recipient));
  const { name, note } = form.draft;
  const saved = form.saved;
  const [aliasOpen, setAliasOpen] = useState(false);
  const [ignore, setIgnore] = useState<Transaction | null>(null);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const categories = useQuery({
    queryKey: queryKeys.categories(c.apiUrl), queryFn: ({ signal }) => fetchCategories(c, signal),
  });
  const classification = useClassification(c, categories.data ?? []);
  const txns = useInfiniteQuery({
    queryKey: queryKeys.transactions(c.apiUrl, { recipientUuid: recipient.uuid, size: 30 }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchTransactions(c, {
      recipientUuid: recipient.uuid, page: pageParam, size: 30, sortBy: 'timestamp', sortOrder: 'desc',
    }, signal),
    getNextPageParam: page => page.hasNext ? page.page + 1 : undefined,
  });
  const save = useMutation({
    mutationFn: () => updateRecipient(c, recipient.uuid, { displayName: name.trim(), note: note.trim() || null }),
    onSuccess: async result => {
      const saved = { name: result.displayName, note: result.note ?? '' };
      setForm(previous => ({ ...previous, draft: { ...saved }, saved }));
      await invalidate(); toast({ message: 'Recipient saved.' });
    },
  });
  // Defer reconciliation during saving so an older in-flight refetch cannot reset the saved result.
  if (!save.isPending && form.updatedAt !== recipient.updatedAt) {
    setForm(reconcileRecipientForm(form, recipient));
  }
  const dirty = name !== saved.name || note !== saved.note;
  const busy = save.isPending || classification.busy || classification.promptOpen || Boolean(ignore);
  return <LedgerPage title="Recipient" footer={dirty ? <StickySaveBar saving={save.isPending}
    disabled={!name.trim() || name.trim().length > 200 || note.length > 500 || busy}
    onSave={() => save.mutate()} /> : null}>
    <FlashList data={txns.data?.pages.flatMap(page => page.transactions) ?? []}
      keyExtractor={item => item.uuid} keyboardShouldPersistTaps="handled"
      refreshing={txns.isRefetching && !txns.isFetchingNextPage}
      onRefresh={() => { void txns.refetch(); void invalidate(); }}
      onEndReachedThreshold={0.4}
      onEndReached={() => { if (txns.hasNextPage && !txns.isFetching && !txns.isFetchNextPageError) void txns.fetchNextPage(); }}
      ListHeaderComponent={<View style={{ padding: 16, gap: 12 }}>
        <Text style={type.heading}>{recipient.displayName}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['Transactions', String(recipient.transactionCount)],
            ['Total paid', formatCurrency(recipient.stats.totalAmount)],
            ['Average payment', formatCurrency(recipient.stats.averagePayment)],
            ['Uncategorized', String(recipient.stats.uncategorizedCount)],
          ].map(([label, value]) => <Panel key={label} tone="mint" style={{ padding: 12, flexGrow: 1, gap: 4 }}>
            <Text style={type.label}>{label}</Text><Text style={[type.number, { fontSize: 22 }]}>{value}</Text>
          </Panel>)}
        </View>
        {recipient.stats.firstPaidAt ? <Text style={type.muted}>First paid {formatTransactionTime(recipient.stats.firstPaidAt)}</Text> : null}
        {recipient.stats.lastPaidAt ? <Text style={type.muted}>Last paid {formatTransactionTime(recipient.stats.lastPaidAt)}</Text> : null}
        <TextField label="Name" value={name} maxLength={200} editable={!save.isPending} onChangeText={name => setForm(previous => ({ ...previous, draft: { ...previous.draft, name } }))} />
        <TextField label="Note" value={note} maxLength={500} multiline editable={!save.isPending}
          hint={`${note.length}/500 characters`} onChangeText={note => setForm(previous => ({ ...previous, draft: { ...previous.draft, note } }))} />
        {save.isError ? <Text accessibilityRole="alert" style={type.error}>{errorMessage(save.error)}</Text> : null}
        <Text style={type.heading}>Aliases</Text>
        {recipient.aliases.length ? recipient.aliases.map(alias => <Panel key={alias.uuid} style={{ padding: 12, gap: 8 }}>
          <Text selectable style={type.body}>{alias.value}</Text>
          <Text style={type.muted}>{alias.aliasType.replaceAll('_', ' ')}</Text>
          <Button label="Copy alias" variant="secondary" onPress={() => {
            try { Clipboard.setString(alias.value); toast({ message: 'Alias copied.' }); }
            catch { toast({ message: 'Could not copy. Select the alias text to copy it.' }); }
          }} />
        </Panel>) : <Text style={type.muted}>No aliases yet.</Text>}
        <Button label="Add alias" variant="secondary" disabled={busy} onPress={() => setAliasOpen(true)} />
        <ApplyRecipientCategory credentials={c} recipient={recipient} />
        <Button label={recipient.existingRuleUuid ? 'Open rule' : 'Create rule'} variant="secondary" disabled={busy}
          onPress={() => router.push({ pathname: '/rules', params: recipient.existingRuleUuid ?
            { ruleUuid: recipient.existingRuleUuid } : { recipientUuid: recipient.uuid } })} />
        <Text style={type.heading}>Transactions</Text>
        {categories.isError ? <InlineError message={errorMessage(categories.error)} onRetry={() => void categories.refetch()} /> : null}
        {txns.isPending ? <Skeleton height={100} /> : null}
      </View>}
      renderItem={({ item }) => <LedgerRow transaction={item} disabled={busy}
        onClassify={classification.openCategory} onIgnore={setIgnore} />}
      ListEmptyComponent={txns.isSuccess ? <View style={{ padding: 16 }}><EmptyState title="No transactions"
        message="Payments to this recipient will appear here." /></View> : null}
      ListFooterComponent={<View style={{ padding: 16, gap: 12 }}>
        {txns.isError ? <InlineError message={errorMessage(txns.error)}
          onRetry={() => void (txns.isFetchNextPageError ? txns.fetchNextPage() : txns.refetch())} /> : null}
        {txns.hasNextPage ? <Button label={txns.isFetchingNextPage ? 'Loading…' : 'Load more transactions'}
          variant="secondary" disabled={txns.isFetching} onPress={() => void txns.fetchNextPage()} /> : null}
      </View>} />
    {aliasOpen ? <AliasSheet credentials={c} recipientUuid={recipient.uuid} onClose={() => setAliasOpen(false)} /> : null}
    {ignore ? <IgnoreRecipient credentials={c} transaction={ignore} onClose={() => setIgnore(null)} /> : null}
    {classification.sheets}
  </LedgerPage>;
}
