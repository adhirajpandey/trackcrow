import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Copy, EllipsisVertical, EyeOff, List, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Clipboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { FormField, FormInput } from '../../components/form-controls';
import { AliasSheet } from '../../components/recipients/alias-sheet';
import { ApplyRecipientCategory } from '../../components/recipients/apply-category';
import { useInvalidateRecipientsAndRules } from '../../components/recipients/shared';
import { RecipientTransactionRow } from '../../components/recipients/transaction-row';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { IgnoreRecipient } from '../../components/transactions/actions';
import { TransactionPage, TransactionSession, errorMessage } from '../../components/transactions/shared';
import { Button, Chip, HeaderIconButton, InlineError, Panel, Skeleton, TextLink, type } from '../../components/ui';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipientDetail, updateRecipient, type RecipientDetail } from '../../lib/api/recipients';
import { fetchTransactions } from '../../lib/api/transactions';
import { formatCurrency } from '../../lib/format';
import { queryKeys } from '../../lib/query-keys';
import { recipientForm, reconcileRecipientForm } from '../../lib/recipient-draft';
import { dayLabel, istDateKey, istDateTime } from '../../lib/transaction-dates';
import { encodeFilters } from '../../lib/transaction-filters';
import { colors, fonts, radii } from '../../theme';

const previewSize = 5;

export default function RecipientDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <TransactionSession>{(c) => <Detail key={id} credentials={c} id={id ?? ''} />}</TransactionSession>;
}

function Detail({ credentials: c, id }: { credentials: Credentials; id: string }) {
  const query = useQuery({
    queryKey: queryKeys.recipient(c.apiUrl, id),
    queryFn: ({ signal }) => fetchRecipientDetail(c, id, signal),
  });
  if (query.isPending || query.isError)
    return (
      <TransactionPage title="Recipients" heading="Recipient">
        {query.isPending ? (
          <Skeleton height={200} />
        ) : (
          <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        )}
      </TransactionPage>
    );
  return <RecipientEditor credentials={c} recipient={query.data} />;
}

function paidAt(timestamp: string | null) {
  return timestamp ? `${dayLabel(istDateKey(timestamp))}, ${istDateTime(timestamp).slice(11)}` : '—';
}

function RecipientEditor({ credentials: c, recipient }: { credentials: Credentials; recipient: RecipientDetail }) {
  const [form, setForm] = useState(() => recipientForm(recipient));
  const { name, note } = form.draft;
  const saved = form.saved;
  const [aliasOpen, setAliasOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const txns = useQuery({
    queryKey: queryKeys.transactions(c.apiUrl, { recipientUuid: recipient.uuid, size: previewSize }),
    queryFn: ({ signal }) =>
      fetchTransactions(
        c,
        { recipientUuid: recipient.uuid, page: 1, size: previewSize, sortBy: 'timestamp', sortOrder: 'desc' },
        signal,
      ),
  });
  const save = useMutation({
    mutationFn: () => updateRecipient(c, recipient.uuid, { displayName: name.trim(), note: note.trim() || null }),
    onSuccess: async (result) => {
      const next = { name: result.displayName, note: result.note ?? '' };
      setForm((previous) => ({ ...previous, draft: { ...next }, saved: next }));
      await invalidate();
      toast({ message: 'Recipient saved.' });
    },
  });
  // Defer reconciliation during saving so an older in-flight refetch cannot reset the saved result.
  if (!save.isPending && form.updatedAt !== recipient.updatedAt) {
    setForm(reconcileRecipientForm(form, recipient));
  }
  const dirty = name !== saved.name || note !== saved.note;
  const busy = save.isPending || ignoring;
  const viewAll = () =>
    router.navigate({ pathname: '/(tabs)/transactions', params: encodeFilters({ recipientUuid: recipient.uuid }) });
  const setDraft = (draft: Partial<typeof form.draft>) =>
    setForm((previous) => ({ ...previous, draft: { ...previous.draft, ...draft } }));
  return (
    <TransactionPage
      title="Recipients"
      heading={recipient.displayName}
      headingAction={
        <HeaderIconButton
          icon={EllipsisVertical}
          label="More actions"
          disabled={busy}
          onPress={() => setActionsOpen(true)}
        />
      }
      footer={
        dirty ? (
          <StickySaveBar
            saving={save.isPending}
            disabled={!name.trim() || name.trim().length > 200 || note.length > 500 || busy}
            onSave={() => save.mutate()}
          />
        ) : null
      }
    >
      <Panel tone="mint" style={styles.stats}>
        <Text style={[type.number, styles.total]}>{formatCurrency(recipient.stats.totalAmount)}</Text>
        <Text style={type.heading}>Total paid</Text>
        <Text style={type.body}>
          {recipient.transactionCount} {recipient.transactionCount === 1 ? 'transaction' : 'transactions'} ·{' '}
          {formatCurrency(recipient.stats.averagePayment)} average · {recipient.stats.uncategorizedCount}{' '}
          uncategorized
        </Text>
        <Chip label={`Last paid: ${paidAt(recipient.stats.lastPaidAt)}`} />
        <Text style={type.muted}>First paid: {paidAt(recipient.stats.firstPaidAt)}</Text>
      </Panel>
      <FormField label="Name">
        <FormInput
          accessibilityLabel="Name"
          value={name}
          maxLength={200}
          editable={!save.isPending}
          onChangeText={(value) => setDraft({ name: value })}
        />
      </FormField>
      <View>
        <FormField label="Note">
          <FormInput
            accessibilityLabel="Note"
            placeholder="Add a note…"
            value={note}
            maxLength={500}
            multiline
            editable={!save.isPending}
            onChangeText={(value) => setDraft({ note: value })}
          />
        </FormField>
        <Text style={[type.muted, styles.counter]}>{note.length}/500 characters</Text>
      </View>
      {save.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <Text style={styles.section}>Aliases</Text>
      <Panel style={styles.aliases}>
        {recipient.aliases.length ? (
          recipient.aliases.map((alias) => (
            <View key={alias.uuid} style={styles.alias}>
              <View style={styles.flex}>
                <Text selectable style={type.body}>
                  {alias.value}
                </Text>
                <Text style={type.muted}>{alias.aliasType.replaceAll('_', ' ')}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Copy alias ${alias.value}`}
                hitSlop={12}
                onPress={() => {
                  try {
                    Clipboard.setString(alias.value);
                    toast({ message: 'Alias copied.' });
                  } catch {
                    toast({ message: 'Could not copy. Select the alias text to copy it.' });
                  }
                }}
              >
                <Copy size={18} color={colors.foreground} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={type.muted}>No aliases yet.</Text>
        )}
        <Button label="Add alias" icon={Plus} compact disabled={busy} onPress={() => setAliasOpen(true)} />
      </Panel>
      <Text style={styles.section}>Automation</Text>
      <Button
        label={recipient.existingRuleUuid ? 'Open rule' : 'Create rule'}
        variant="secondary"
        disabled={busy}
        onPress={() =>
          router.push({
            pathname: '/rules',
            params: recipient.existingRuleUuid
              ? { ruleUuid: recipient.existingRuleUuid }
              : { recipientUuid: recipient.uuid },
          })
        }
      />
      <ApplyRecipientCategory credentials={c} recipient={recipient} />
      <View style={styles.divider} />
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Transactions ({recipient.transactionCount})</Text>
        {recipient.transactionCount > 0 ? <TextLink label="View all" onPress={viewAll} /> : null}
      </View>
      {txns.isPending ? <Skeleton height={100} /> : null}
      {txns.isError ? <InlineError message={errorMessage(txns.error)} onRetry={() => void txns.refetch()} /> : null}
      {txns.data?.transactions.map((txn) => <RecipientTransactionRow key={txn.uuid} transaction={txn} />)}
      {txns.isSuccess && !txns.data.transactions.length ? (
        <EmptyState title="No transactions" message="Payments to this recipient will appear here." />
      ) : null}
      <SelectSheet
        open={actionsOpen}
        title="Recipient actions"
        searchable={false}
        chevrons
        options={[
          {
            value: 'transactions',
            label: 'View all transactions',
            description: 'Open Transactions filtered to this recipient',
            icon: List,
          },
          {
            value: 'ignore',
            label: 'Ignore future SMS',
            description: `Stop importing transactions from ${recipient.displayName}`,
            icon: EyeOff,
          },
        ]}
        onClose={() => setActionsOpen(false)}
        onSelect={(action) => {
          if (action === 'transactions') viewAll();
          if (action === 'ignore') setIgnoring(true);
        }}
      />
      {aliasOpen ? (
        <AliasSheet credentials={c} recipientUuid={recipient.uuid} onClose={() => setAliasOpen(false)} />
      ) : null}
      {ignoring ? (
        <IgnoreRecipient
          credentials={c}
          transaction={{ recipientUuid: recipient.uuid, recipientDisplayName: recipient.displayName }}
          onClose={() => setIgnoring(false)}
        />
      ) : null}
    </TransactionPage>
  );
}

const styles = StyleSheet.create({
  stats: { padding: 16, gap: 8 },
  total: { fontSize: 40 },
  counter: { alignSelf: 'flex-end', marginTop: 4 },
  section: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aliases: { padding: 12, gap: 10 },
  alias: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  flex: { flex: 1 },
  divider: { height: 2, backgroundColor: colors.border, marginVertical: 4 },
});
