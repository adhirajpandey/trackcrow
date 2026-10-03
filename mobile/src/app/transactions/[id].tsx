import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, fonts, radii } from '../../theme';
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
  // A fetched suggestion that differs from the current classification waits to be accepted.
  const pending =
    suggestion.data?.suggestedCategoryUuid &&
    (suggestion.data.suggestedCategoryUuid !== txn.categoryUuid ||
      (suggestion.data.suggestedSubcategoryUuid ?? null) !== (txn.subcategoryUuid ?? null))
      ? suggestion.data
      : null;
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
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${txn.recipientDisplayName}, open recipient`}
          hitSlop={8}
          onPress={() => router.push({ pathname: '/recipients/[id]', params: { id: txn.recipientUuid } })}
        >
          <Text style={type.heading}>{txn.recipientDisplayName}</Text>
        </Pressable>
        <Text style={type.body}>
          {txn.type} · {formatTransactionTime(txn.timestamp)} · {txn.accountName ?? 'No account'}
        </Text>
        <Chip label={`Source: ${txn.source}`} />
        <Text style={type.muted}>Recipient identifier: {txn.recipientRaw}</Text>
      </Panel>
      <Panel style={{ padding: 16, gap: 12 }}>
        <Text style={type.heading}>Classification</Text>
        {pending ? (
          <Status
            tone="review"
            icon
            label={`${suggestion.data!.suggestedCategory}${suggestion.data!.suggestedSubCategory ? ` / ${suggestion.data!.suggestedSubCategory}` : ''} · Suggested`}
          />
        ) : (
          <Status tone={txn.categoryUuid ? 'mint' : 'review'} label={txn.category ?? 'Uncategorized'} />
        )}
        <Text style={type.muted}>
          {pending
            ? 'Suggested by TrackCrow'
            : txn.classificationSource
              ? `Filed by ${txn.classificationSource.toLowerCase()}${txn.classificationChangedAt ? ` · ${formatTransactionTime(txn.classificationChangedAt)}` : ''}`
              : 'Needs a category'}
        </Text>
        <View style={styles.grid}>
          {options.categories.data?.slice(0, 4).map((item) => (
            <Button
              key={item.uuid}
              label={`${txn.categoryUuid === item.uuid ? '✓ ' : ''}${item.name}`}
              selected={txn.categoryUuid === item.uuid}
              disabled={busy}
              variant={txn.categoryUuid === item.uuid ? 'primary' : 'secondary'}
              style={styles.cell}
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
        {/* Stays in place but disabled until a category is chosen; a chosen subcategory shows in mint. */}
        <Button
          label={txn.subcategory ?? 'Choose subcategory'}
          variant="secondary"
          trailingIcon={txn.subcategory ? undefined : ChevronRight}
          disabled={busy || !txn.categoryUuid}
          style={txn.subcategory ? styles.subcategory : !txn.categoryUuid ? styles.muted : undefined}
          onPress={() => setSubcategoryOpen(true)}
        />
        <Button
          label="Clear classification"
          variant="secondary"
          disabled={busy || !txn.categoryUuid}
          style={styles.muted}
          onPress={() => {
            void classification
              .classify(txn, { categoryUuid: null, subcategoryUuid: null })
              .catch(() => undefined);
          }}
        />
        {pending ? (
          <Button
            label="Accept suggestion"
            disabled={busy || suggestion.isFetching}
            onPress={() => void applySuggestion()}
          />
        ) : (
          <Button
            label={suggestion.isFetching ? 'Finding suggestion…' : 'Suggest'}
            disabled={busy || suggestion.isFetching}
            onPress={() => void suggestion.refetch()}
          />
        )}
        {suggestion.isSuccess && !suggestion.data?.suggestedCategoryUuid ? (
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

/** The full-width classification status; suggestions carry a sparkle as well as the label. */
function Status({ label, tone, icon = false }: { label: string; tone: 'mint' | 'review'; icon?: boolean }) {
  return (
    <View style={[styles.status, { backgroundColor: tone === 'mint' ? colors.paperMint : colors.uncategorized }]}>
      {icon ? <Sparkles size={16} color={colors.foreground} strokeWidth={2.25} /> : null}
      <Text style={styles.statusText} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { flexBasis: '45%', flexGrow: 1 },
  subcategory: { backgroundColor: colors.paperMint },
  muted: { backgroundColor: colors.muted },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
});
