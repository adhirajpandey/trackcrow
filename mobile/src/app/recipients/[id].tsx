import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Copy, EllipsisVertical, Eye, EyeOff, List, ListChecks, Pencil, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Clipboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { FormField, SelectRow } from '../../components/form-controls';
import { AliasSheet } from '../../components/recipients/alias-sheet';
import { ApplyRecipientCategory } from '../../components/recipients/apply-category';
import { useInvalidateRecipientsAndRules } from '../../components/recipients/shared';
import { openRule } from '../../components/rules/open-rule';
import { RecipientTransactionRow } from '../../components/recipients/transaction-row';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { TextEditSheet } from '../../components/text-edit-sheet';
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
  const [editing, setEditing] = useState(false);
  const [textField, setTextField] = useState<'name' | 'note' | null>(null);
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
      setEditing(false);
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
        <View style={styles.headingActions}>
          <HeaderIconButton
            icon={editing ? X : Pencil}
            label={editing ? 'Cancel editing' : 'Edit recipient'}
            disabled={busy}
            onPress={() => {
              if (editing) setForm((previous) => ({ ...previous, draft: { ...previous.saved } }));
              setEditing(!editing);
            }}
          />
          <HeaderIconButton
            icon={EllipsisVertical}
            label="More actions"
            disabled={busy}
            onPress={() => setActionsOpen(true)}
          />
        </View>
      }
      footer={
        editing ? (
          <StickySaveBar
            saving={save.isPending}
            disabled={!dirty || !name.trim() || name.trim().length > 200 || note.length > 500 || busy}
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
        <SelectRow
          label="Name"
          value={name}
          placeholder="Name"
          disabled={busy}
          readOnly={!editing}
          onPress={() => setTextField('name')}
        />
      </FormField>
      <FormField label="Note" optional>
        <SelectRow
          label="Note"
          value={note || undefined}
          placeholder={editing ? 'Add a note…' : '—'}
          disabled={busy}
          readOnly={!editing}
          onPress={() => setTextField('note')}
        />
      </FormField>
      {save.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <FormField label="Aliases">
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
        {editing ? (
          <Button
            label="Add alias"
            icon={Plus}
            variant="secondary"
            disabled={busy}
            onPress={() => setAliasOpen(true)}
          />
        ) : null}
      </FormField>
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
          recipient.existingRuleUuid
            ? { value: 'rule', label: 'View rule', description: 'Open the rule for this recipient', icon: Eye }
            : {
                value: 'rule',
                label: 'Create rule',
                description: 'Automatically classify transactions from this recipient',
                icon: ListChecks,
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
          if (action === 'rule')
            openRule(recipient.existingRuleUuid ?? 'new', recipient.existingRuleUuid ? {} : { recipientUuid: recipient.uuid });
        }}
      />
      <TextEditSheet
        open={Boolean(textField)}
        title={textField === 'note' ? 'Note' : 'Name'}
        value={textField === 'note' ? note : name}
        placeholder={textField === 'note' ? 'Add a note…' : 'Name'}
        multiline={textField === 'note'}
        maxLength={textField === 'note' ? 500 : 200}
        onDone={(value) => setDraft(textField === 'note' ? { note: value } : { name: value })}
        onClose={() => setTextField(null)}
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
  headingActions: { flexDirection: 'row', gap: 8 },
  stats: { padding: 16, gap: 8 },
  total: { fontSize: 40 },
  section: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
