import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { Button, Chip, InlineError, Panel, Skeleton, TextLink, type } from '../../components/ui';
import { useClassification } from '../../components/transactions/actions';
import { AmountEntry, TransactionFields } from '../../components/transactions/form-fields';
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
      <TransactionPage title="Transaction">
        <Skeleton height={180} />
      </TransactionPage>
    );
  if (query.isError)
    return (
      <TransactionPage title="Transaction">
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
    [subcategoryOpen, setSubcategoryOpen] = useState(false);
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
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const save = useMutation({
    mutationFn: () =>
      updateTransaction(c, txn.uuid, {
        ...input!,
        categoryUuid: txn.categoryUuid,
        subcategoryUuid: txn.subcategoryUuid,
      }),
    onSuccess: async () => {
      setSavedDraft(draft);
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
  async function applySuggestion() {
    if (!suggestion.data?.suggestedCategoryUuid) return;
    try {
      await classification.classify(txn, {
        categoryUuid: suggestion.data.suggestedCategoryUuid,
        subcategoryUuid: suggestion.data.suggestedSubcategoryUuid,
        classificationIntent: 'SUGGESTION',
      });
    } catch {
      void suggestion.refetch();
    }
  }
  return (
    <TransactionPage
      title="Transaction"
      footer={
        dirty ? (
          <StickySaveBar saving={save.isPending} disabled={!input || busy} onSave={() => save.mutate()} />
        ) : null
      }
    >
      <Panel tone="mint" style={{ padding: 16, gap: 8 }}>
        <Text style={[type.number, { fontSize: 40 }]}>{formatCurrency(txn.amount)}</Text>
        <TextLink
          label={txn.recipientDisplayName}
          onPress={() => router.push({ pathname: '/recipients/[id]', params: { id: txn.recipientUuid } })}
        />
        <Text style={type.body}>
          {txn.type} · {formatTransactionTime(txn.timestamp)} · {txn.accountName ?? 'No account'}
        </Text>
        <Chip label={`Source: ${txn.source}`} />
        <Text style={type.muted}>Recipient identifier: {txn.recipientRaw}</Text>
      </Panel>
      <Panel tone={txn.categoryUuid ? 'paper' : 'review'} style={{ padding: 16, gap: 12 }}>
        <Text style={type.heading}>Classification</Text>
        <Chip
          label={txn.category ?? 'Needs classification'}
          tone={txn.categoryUuid ? 'mint' : 'uncategorized'}
        />
        {txn.classificationSource ? (
          <Text style={type.muted}>
            Filed by {txn.classificationSource.toLowerCase()}
            {txn.classificationChangedAt ? ` · ${formatTransactionTime(txn.classificationChangedAt)}` : ''}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {options.categories.data?.slice(0, 4).map((item) => (
            <Button
              key={item.uuid}
              label={`${txn.categoryUuid === item.uuid ? '✓ ' : ''}${item.name}`}
              disabled={busy}
              variant="secondary"
              onPress={() => {
                void classification
                  .classify(txn, { categoryUuid: item.uuid, subcategoryUuid: null })
                  .catch(() => undefined);
              }}
            />
          ))}
        </View>
        <Button
          label="More categories…"
          variant="secondary"
          disabled={busy}
          onPress={() => classification.openCategory(txn)}
        />
        {txn.categoryUuid ? (
          <>
            <Button
              label={txn.subcategory ?? 'Choose subcategory'}
              variant="secondary"
              disabled={busy}
              onPress={() => setSubcategoryOpen(true)}
            />
            <Button
              label="Clear classification"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                void classification
                  .classify(txn, { categoryUuid: null, subcategoryUuid: null })
                  .catch(() => undefined);
              }}
            />
          </>
        ) : null}
        <Button
          label={suggestion.isFetching ? 'Finding suggestion…' : 'Suggest'}
          variant="secondary"
          disabled={busy || suggestion.isFetching}
          onPress={() => void suggestion.refetch()}
        />
        {suggestion.data?.suggestedCategoryUuid ? (
          <Button
            label={`Use ${suggestion.data.suggestedCategory}${suggestion.data.suggestedSubCategory ? ` / ${suggestion.data.suggestedSubCategory}` : ''}`}
            disabled={busy || suggestion.isFetching}
            onPress={() => void applySuggestion()}
          />
        ) : suggestion.isSuccess ? (
          <Text style={type.muted}>No suggestion yet. Choose a category.</Text>
        ) : null}
        {suggestion.isError ? (
          <InlineError message={errorMessage(suggestion.error)} onRetry={() => void suggestion.refetch()} />
        ) : null}
        {options.categories.isError ? (
          <InlineError
            message={errorMessage(options.categories.error)}
            onRetry={() => void options.categories.refetch()}
          />
        ) : null}
      </Panel>
      <Panel tone="lilac" style={{ padding: 12, gap: 8 }}>
        <Text style={type.label}>Automation</Text>
        {txn.classificationSource === 'RULE' && txn.classificationRule ? (
          <>
            <Text style={type.body}>
              Categorized by rule {txn.classificationRule.name}
              {txn.classificationRule.isDeleted ? ' (deleted)' : ''}
            </Text>
            {!txn.classificationRule.isDeleted ? (
              <TextLink
                label="View rule"
                onPress={() =>
                  router.push({ pathname: '/rules', params: { ruleUuid: txn.classificationRule!.uuid } })
                }
              />
            ) : null}
          </>
        ) : context.isPending ? (
          <Text style={type.muted}>Checking recipient rule…</Text>
        ) : context.isError ? (
          <InlineError message={errorMessage(context.error)} onRetry={() => void context.refetch()} />
        ) : context.data?.existingRuleUuid ? (
          <>
            <Text style={type.body}>This recipient has a rule. Your manual classification is kept.</Text>
            <TextLink
              label="View rule"
              onPress={() =>
                router.push({ pathname: '/rules', params: { ruleUuid: context.data!.existingRuleUuid! } })
              }
            />
          </>
        ) : (
          <Text style={type.body}>No rule for {txn.recipientDisplayName}.</Text>
        )}
        <Button
          label={context.data?.existingRuleUuid ? 'Replace rule' : 'Create rule'}
          variant="secondary"
          disabled={busy || !context.data}
          onPress={() =>
            txn.categoryUuid && txn.category
              ? setRulePrompt({
                  transaction: txn,
                  categoryUuid: txn.categoryUuid,
                  category: txn.category,
                  subcategoryUuid: txn.subcategoryUuid,
                })
              : classification.openCategory(txn)
          }
        />
      </Panel>
      <AmountEntry draft={draft} onChange={setDraft} disabled={busy} />
      <TransactionFields
        draft={draft}
        onChange={setDraft}
        categories={options.categories.data ?? []}
        accounts={options.accounts.data ?? []}
        classification={false}
        disabled={busy}
      />
      {txn.locationRaw ? (
        <TextLink
          label="Open location in Maps"
          onPress={() => {
            void Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(txn.locationRaw!)}`,
            ).catch(() => toast({ message: 'Could not open Maps.' }));
          }}
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
      {rulePrompt ? (
        <RulePrompt credentials={c} selection={rulePrompt} onClose={() => setRulePrompt(null)} />
      ) : null}
      {classification.sheets}
    </TransactionPage>
  );
}
