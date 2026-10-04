import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  EllipsisVertical,
  Pencil,
  X,
  Eye,
  ListChecks,
  MapPin,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { FormField, SelectRow } from '../../components/form-controls';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { Button, HeaderIconButton, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { useClassification } from '../../components/transactions/actions';
import { TransactionFormFields } from '../../components/transactions/form-fields';
import { RecipientPicker, type SelectedRecipient } from '../../components/transactions/recipient-picker';
import { SummaryPanel } from '../../components/transactions/summary-panel';
import { RulePrompt, type RulePromptSelection } from '../../components/transactions/rule-prompt';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
  useTransactionOptions,
} from '../../components/transactions/shared';
import type { Credentials } from '../../lib/api/client';
import { fetchRecipientDetail } from '../../lib/api/recipients';
import {
  deleteTransaction,
  fetchCategorySuggestion,
  fetchTransaction,
  updateTransaction,
  type TransactionDetail,
} from '../../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../../lib/format';
import { draftInput, transactionDraft } from '../../lib/transaction-draft';
import { queryKeys } from '../../lib/query-keys';
export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return (
    <TransactionSession>
      {(credentials) => <Detail credentials={credentials} id={id ?? ''} />}
    </TransactionSession>
  );
}
function Detail({ credentials: c, id }: { credentials: Credentials; id: string }) {
  const query = useQuery({
    queryKey: queryKeys.transaction(c.apiUrl, id),
    queryFn: ({ signal }) => fetchTransaction(c, id, signal),
  });
  if (query.isPending)
    return (
      <TransactionPage title="Transactions" heading="Transaction Details">
        <Skeleton height={180} />
      </TransactionPage>
    );
  if (query.isError)
    return (
      <TransactionPage title="Transactions" heading="Transaction Details">
        <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </TransactionPage>
    );
  return <TransactionEditor key={id} credentials={c} transaction={query.data} />;
}
function TransactionEditor({
  credentials: c,
  transaction: txn,
}: {
  credentials: Credentials;
  transaction: TransactionDetail;
}) {
  const [draft, setDraft] = useState(() => transactionDraft(txn));
  const [savedDraft, setSavedDraft] = useState(draft);
  const [deleting, setDeleting] = useState(false),
    [subcategoryOpen, setSubcategoryOpen] = useState(false),
    [actionsOpen, setActionsOpen] = useState(false),
    [confirmSuggestion, setConfirmSuggestion] = useState(false),
    [editing, setEditing] = useState(false),
    [recipientOpen, setRecipientOpen] = useState(false);
  const original: SelectedRecipient = { uuid: txn.recipientUuid, displayName: txn.recipientDisplayName };
  const [recipient, setRecipient] = useState(original);
  const [rulePrompt, setRulePrompt] = useState<RulePromptSelection | null>(null);
  const options = useTransactionOptions(c),
    invalidate = useInvalidateLedger(c),
    toast = useToast();
  const classification = useClassification(c, options.categories.data ?? []);
  const category = options.categories.data?.find((item) => item.uuid === txn.categoryUuid);
  const context = useQuery({
    queryKey: ['recipient', c.apiUrl, txn.recipientUuid, 'automation'],
    queryFn: ({ signal }) => fetchRecipientDetail(c, txn.recipientUuid, signal),
  });
  const suggestion = useQuery({
    queryKey: [...queryKeys.transaction(c.apiUrl, txn.uuid), 'suggestion'],
    enabled: false,
    queryFn: ({ signal }) => fetchCategorySuggestion(c, txn.uuid, signal),
  });
  const input = draftInput(draft, txn);
  const recipientChanged = recipient.uuid !== txn.recipientUuid;
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft) || recipientChanged;
  const save = useMutation({
    mutationFn: () =>
      updateTransaction(c, txn.uuid, {
        ...input!,
        ...(recipientChanged ? { recipientUuid: recipient.uuid } : {}),
        categoryUuid: txn.categoryUuid,
        subcategoryUuid: txn.subcategoryUuid,
      }),
    onSuccess: async () => {
      setSavedDraft(draft);
      setEditing(false);
      await invalidate();
      toast({ message: 'Transaction saved.' });
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteTransaction(c, txn.uuid),
    onSuccess: async () => {
      await invalidate();
      toast({ message: 'Transaction deleted.' });
      router.dismissTo('/(tabs)/transactions');
    },
  });
  const busy =
    save.isPending ||
    remove.isPending ||
    classification.busy ||
    classification.promptOpen ||
    Boolean(rulePrompt);
  const suggested = suggestion.data?.suggestedCategoryUuid ? suggestion.data : null;
  const ruleUuid =
    txn.classificationSource === 'RULE' && txn.classificationRule && !txn.classificationRule.isDeleted
      ? txn.classificationRule.uuid
      : (context.data?.existingRuleUuid ?? null);
  const filedBy = txn.classificationSource
    ? `Filed by ${txn.classificationSource.toLowerCase()}${txn.classificationChangedAt ? ` · ${formatTransactionTime(txn.classificationChangedAt)}` : ''}`
    : undefined;
  const actions = [
    {
      value: 'suggest',
      label: suggestion.isFetching ? 'Finding suggestion…' : 'Suggest a category',
      description: 'Get a category suggestion for this transaction',
      icon: Sparkles,
    },
    ...(txn.categoryUuid
      ? [{ value: 'clear', label: 'Clear classification', description: filedBy, icon: Trash2 }]
      : []),
    ...(ruleUuid
      ? [{ value: 'view-rule', label: 'View rule', description: 'Open the rule for this recipient', icon: Eye }]
      : []),
    ...(context.data
      ? [
          {
            value: 'rule',
            label: context.data.existingRuleUuid ? 'Replace rule' : 'Create rule',
            description: 'Automatically classify similar transactions',
            icon: ListChecks,
          },
        ]
      : []),
    ...(txn.locationRaw
      ? [{ value: 'maps', label: 'Open location in Maps', description: txn.locationRaw, icon: MapPin }]
      : []),
  ];
  async function suggest() {
    const result = await suggestion.refetch();
    if (result.isError) toast({ message: errorMessage(result.error) });
    else if (result.data?.suggestedCategoryUuid) setConfirmSuggestion(true);
    else toast({ message: 'No suggestion yet. Choose a category.' });
  }
  async function applySuggestion() {
    setConfirmSuggestion(false);
    if (!suggested) return;
    try {
      await classification.classify(txn, {
        categoryUuid: suggested.suggestedCategoryUuid,
        subcategoryUuid: suggested.suggestedSubcategoryUuid,
        classificationIntent: 'SUGGESTION',
      });
    } catch {
      void suggestion.refetch();
    }
  }
  function runAction(action: string) {
    if (action === 'suggest') void suggest();
    if (action === 'clear')
      void classification.classify(txn, { categoryUuid: null, subcategoryUuid: null }).catch(() => undefined);
    if (action === 'view-rule' && ruleUuid) router.push({ pathname: '/rules', params: { ruleUuid } });
    if (action === 'rule') {
      if (txn.categoryUuid && txn.category)
        setRulePrompt({
          transaction: txn,
          categoryUuid: txn.categoryUuid,
          category: txn.category,
          subcategoryUuid: txn.subcategoryUuid,
        });
      else classification.openCategory(txn);
    }
    if (action === 'maps')
      void Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(txn.locationRaw!)}`,
      ).catch(() => toast({ message: 'Could not open Maps.' }));
  }
  return (
    <TransactionPage
      title="Transactions"
      heading="Transaction Details"
      headingAction={
        <View style={styles.headingActions}>
          <HeaderIconButton
            icon={editing ? X : Pencil}
            label={editing ? 'Cancel editing' : 'Edit transaction'}
            disabled={busy}
            onPress={() => {
              if (editing) {
                setDraft(savedDraft);
                setRecipient(original);
              }
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
          <StickySaveBar saving={save.isPending} disabled={!dirty || !input || busy} onSave={() => save.mutate()} />
        ) : null
      }
    >
      <SummaryPanel transaction={txn} />
      <TransactionFormFields
        variant="detail"
        draft={draft}
        onChange={setDraft}
        categories={options.categories.data ?? []}
        accounts={options.accounts.data ?? []}
        dateLabel="Date and Time (IST)"
        disabled={busy}
        readOnly={!editing}
        recipient={
          <SelectRow
            label="Recipient"
            value={recipient.displayName}
            placeholder="Recipient"
            chosen={editing && recipientChanged}
            disabled={busy}
            onPress={() =>
              editing
                ? setRecipientOpen(true)
                : router.push({ pathname: '/recipients/[id]', params: { id: txn.recipientUuid } })
            }
          />
        }
        categoryRows={
          <>
            <FormField label="Category" optional>
              <SelectRow
                label="Category"
                value={txn.category ?? undefined}
                placeholder="Select category"
                chosen={Boolean(txn.categoryUuid)}
                disabled={busy}
                readOnly={!editing}
                onPress={() => classification.openCategory(txn)}
              />
            </FormField>
            <FormField label="Subcategory" optional>
              <SelectRow
                label="Subcategory"
                value={txn.subcategory ?? undefined}
                placeholder="Select subcategory"
                chosen={Boolean(txn.subcategoryUuid)}
                disabled={busy || !txn.categoryUuid}
                readOnly={!editing}
                onPress={() => setSubcategoryOpen(true)}
              />
            </FormField>
          </>
        }
      />
      {options.categories.isError ? (
        <InlineError
          message={errorMessage(options.categories.error)}
          onRetry={() => void options.categories.refetch()}
        />
      ) : null}
      {options.accounts.isError ? (
        <InlineError
          message={errorMessage(options.accounts.error)}
          onRetry={() => void options.accounts.refetch()}
        />
      ) : null}
      {save.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <Panel tone="blush" style={{ padding: 16, gap: 12 }}>
        <Text style={type.heading}>Danger zone</Text>
        <Text style={type.body}>Delete this transaction permanently.</Text>
        <Button
          label="Delete transaction"
          variant="destructive"
          disabled={busy || dirty}
          onPress={() => setDeleting(true)}
        />
        {dirty ? <Text style={type.muted}>Save your changes before deleting.</Text> : null}
      </Panel>
      {remove.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {errorMessage(remove.error)}
        </Text>
      ) : null}
      <ConfirmDialog
        open={deleting}
        title="Delete transaction?"
        message={`${txn.recipientDisplayName} · ${formatCurrency(txn.amount)} will be permanently deleted.`}
        destructive
        busy={remove.isPending}
        confirmLabel="Delete"
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
      />
      <ConfirmDialog
        open={confirmSuggestion && Boolean(suggested)}
        title="Use the suggested category?"
        message={`${suggested?.suggestedCategory ?? ''}${suggested?.suggestedSubCategory ? ` / ${suggested.suggestedSubCategory}` : ''}`}
        confirmLabel="Accept suggestion"
        onClose={() => setConfirmSuggestion(false)}
        onConfirm={() => void applySuggestion()}
      />
      <SelectSheet
        open={actionsOpen}
        title="Transaction actions"
        searchable={false}
        chevrons
        options={actions}
        onClose={() => setActionsOpen(false)}
        onSelect={runAction}
      />
      <SelectSheet
        open={subcategoryOpen}
        title="Subcategory"
        options={[
          { value: '', label: 'None' },
          ...(category?.subcategories ?? []).map((item) => ({ value: item.uuid, label: item.name })),
        ]}
        selected={txn.subcategoryUuid ?? ''}
        onClose={() => setSubcategoryOpen(false)}
        onSelect={(value) => {
          void classification
            .classify(txn, { categoryUuid: txn.categoryUuid, subcategoryUuid: value || null })
            .catch(() => undefined);
        }}
      />
      {recipientOpen ? (
        <RecipientPicker credentials={c} onSelect={setRecipient} onClose={() => setRecipientOpen(false)} />
      ) : null}
      {rulePrompt ? (
        <RulePrompt credentials={c} selection={rulePrompt} onClose={() => setRulePrompt(null)} />
      ) : null}
      {classification.sheets}
    </TransactionPage>
  );
}

const styles = StyleSheet.create({
  headingActions: { flexDirection: 'row', gap: 8 },
});
