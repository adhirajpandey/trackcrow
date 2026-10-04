import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, EllipsisVertical, EyeOff, FileText } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField, FormInput, SelectRow } from '../../components/form-controls';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { HeaderIconButton, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { IgnoreRecipient } from '../../components/transactions/actions';
import { TransactionPickers, type TransactionPicker } from '../../components/transactions/form-fields';
import { useReviewQueue } from '../../components/transactions/review-queue';
import { RulePrompt, type RulePromptSelection } from '../../components/transactions/rule-prompt';
import { SummaryPanel } from '../../components/transactions/summary-panel';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
  useTransactionOptions,
} from '../../components/transactions/shared';
import type { Credentials } from '../../lib/api/client';
import {
  fetchCategorySuggestion,
  fetchTransaction,
  updateTransaction,
  type TransactionDetail,
} from '../../lib/api/transactions';
import { queryKeys } from '../../lib/query-keys';
import { draftInput, transactionDraft } from '../../lib/transaction-draft';
import { decodeFilters } from '../../lib/transaction-filters';
import { colors, fonts, minTarget, radii } from '../../theme';

type Dates = { startDate?: string; endDate?: string };

export default function ReviewTransactionScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { startDate, endDate } = decodeFilters(params);
  return (
    <TransactionSession>
      {(credentials) => <ReviewItem credentials={credentials} id={id ?? ''} dates={{ startDate, endDate }} />}
    </TransactionSession>
  );
}

function ReviewItem({ credentials: c, id, dates }: { credentials: Credentials; id: string; dates: Dates }) {
  const query = useQuery({
    queryKey: queryKeys.transaction(c.apiUrl, id),
    queryFn: ({ signal }) => fetchTransaction(c, id, signal),
  });
  if (query.isPending || query.isError)
    return (
      <TransactionPage title="Transactions" heading="Review Transaction">
        {query.isPending ? (
          <Skeleton height={180} />
        ) : (
          <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        )}
      </TransactionPage>
    );
  return <ReviewForm key={id} credentials={c} transaction={query.data} dates={dates} />;
}

function ReviewForm({
  credentials: c,
  transaction: txn,
  dates,
}: {
  credentials: Credentials;
  transaction: TransactionDetail;
  dates: Dates;
}) {
  const [draft, setDraft] = useState(() => transactionDraft(txn));
  const [picker, setPicker] = useState<TransactionPicker | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const [rulePrompt, setRulePrompt] = useState<RulePromptSelection | null>(null);
  const options = useTransactionOptions(c),
    invalidate = useInvalidateLedger(c),
    toast = useToast();
  const queue = useReviewQueue(c, dates.startDate, dates.endDate);
  const categories = options.categories.data ?? [];
  const suggestion = useQuery({
    queryKey: [...queryKeys.transaction(c.apiUrl, txn.uuid), 'suggestion'],
    queryFn: ({ signal }) => fetchCategorySuggestion(c, txn.uuid, signal),
  });
  const suggested = suggestion.data?.suggestedCategoryUuid ? suggestion.data : null;
  const category = categories.find((item) => item.uuid === draft.categoryUuid);
  const subcategory = category?.subcategories.find((item) => item.uuid === draft.subcategoryUuid);
  const account = options.accounts.data?.find((item) => item.uuid === draft.accountUuid);
  const fromSuggestion =
    Boolean(suggested) &&
    draft.categoryUuid === suggested?.suggestedCategoryUuid &&
    draft.subcategoryUuid === suggested?.suggestedSubcategoryUuid;
  const index = queue.rows.findIndex((row) => row.uuid === txn.uuid);
  const input = draftInput(draft, txn);

  async function next() {
    let rows = queue.rows;
    const at = rows.findIndex((row) => row.uuid === txn.uuid);
    if (at === rows.length - 1 && queue.query.hasNextPage) {
      const result = await queue.query.fetchNextPage();
      rows = (result.data?.pages.flatMap((page) => page.transactions) ?? []).filter((row) => !row.categoryUuid);
    }
    const following = rows.slice(at + 1).find((row) => row.uuid !== txn.uuid);
    if (following)
      router.replace({ pathname: '/review/[id]', params: { id: following.uuid, ...definedDates(dates) } });
    else router.back();
  }

  const save = useMutation({
    mutationFn: () =>
      updateTransaction(c, txn.uuid, {
        ...input!,
        ...(fromSuggestion ? { classificationIntent: 'SUGGESTION' as const } : {}),
      }),
    onSuccess: async () => {
      await invalidate();
      toast({ message: category ? `Filed as ${category.name}.` : 'Transaction saved.' });
      if (category)
        setRulePrompt({
          transaction: txn,
          categoryUuid: category.uuid,
          category: category.name,
          subcategoryUuid: draft.subcategoryUuid,
        });
      else void next();
    },
  });
  const busy = save.isPending || Boolean(rulePrompt);

  return (
    <TransactionPage
      title="Transactions"
      heading="Review Transaction"
      headingAction={
        <View style={styles.headingActions}>
          {index >= 0 ? (
            <Text style={type.muted}>
              {index + 1} of {queue.total}
            </Text>
          ) : null}
          <HeaderIconButton
            icon={EllipsisVertical}
            label="More actions"
            disabled={busy}
            onPress={() => setActionsOpen(true)}
          />
        </View>
      }
      footer={
        <StickySaveBar
          label="Save & next"
          icon={ArrowRight}
          saving={save.isPending}
          disabled={!input || busy}
          onSave={() => save.mutate()}
          secondary={{ label: 'Skip', disabled: busy, onPress: () => void next() }}
        />
      }
    >
      <SummaryPanel transaction={txn} />
      {suggested ? (
        <Panel tone="mint" style={styles.suggestion}>
          <View>
            <Text style={type.heading}>Suggested category</Text>
            <Text style={type.muted}>Based on similar transactions</Text>
          </View>
          <SelectRow
            label="Suggested category"
            value={suggested.suggestedCategory ?? undefined}
            placeholder="Category"
            chosen={fromSuggestion}
            disabled={busy}
            onPress={() => setPicker('category')}
          />
          {suggested.suggestedSubCategory ? (
            <SelectRow
              label="Suggested subcategory"
              value={suggested.suggestedSubCategory}
              placeholder="Subcategory"
              chosen={fromSuggestion}
              disabled={busy}
              onPress={() => setPicker('category')}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy || fromSuggestion }}
            disabled={busy || fromSuggestion}
            onPress={() =>
              setDraft({
                ...draft,
                categoryUuid: suggested.suggestedCategoryUuid,
                subcategoryUuid: suggested.suggestedSubcategoryUuid,
              })
            }
            style={styles.apply}
          >
            <Text style={styles.applyText}>{fromSuggestion ? 'Suggestion applied' : 'Apply suggestion'}</Text>
          </Pressable>
        </Panel>
      ) : null}
      <FormField label="Category">
        <SelectRow
          label="Category"
          value={category?.name}
          placeholder="Select category"
          chosen={Boolean(category)}
          disabled={busy}
          onPress={() => setPicker('category')}
          onClear={() => setDraft({ ...draft, categoryUuid: null, subcategoryUuid: null })}
        />
      </FormField>
      <FormField label="Subcategory" optional>
        <SelectRow
          label="Subcategory"
          value={subcategory?.name}
          placeholder="Select subcategory"
          chosen={Boolean(subcategory)}
          disabled={busy || !category}
          onPress={() => setPicker('subcategory')}
        />
      </FormField>
      <FormField label="Payment Method">
        <SelectRow
          label="Payment method"
          value={draft.type}
          placeholder="Select payment method"
          disabled={busy}
          onPress={() => setPicker('type')}
        />
      </FormField>
      <FormField label="Account" optional>
        <SelectRow
          label="Account"
          value={account?.name}
          placeholder="Select account"
          disabled={busy}
          onPress={() => setPicker('account')}
        />
      </FormField>
      <FormField label="Remarks" optional>
        <FormInput
          accessibilityLabel="Remarks"
          placeholder="Add remarks…"
          multiline
          editable={!busy}
          value={draft.remarks}
          onChangeText={(remarks) => setDraft({ ...draft, remarks })}
        />
      </FormField>
      {options.categories.isError ? (
        <InlineError
          message={errorMessage(options.categories.error)}
          onRetry={() => void options.categories.refetch()}
        />
      ) : null}
      {suggestion.isError ? (
        <InlineError message={errorMessage(suggestion.error)} onRetry={() => void suggestion.refetch()} />
      ) : null}
      {save.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {errorMessage(save.error)}
        </Text>
      ) : null}
      <TransactionPickers
        picker={picker}
        draft={draft}
        onChange={setDraft}
        onClose={() => setPicker(null)}
        categories={categories}
        accounts={options.accounts.data ?? []}
      />
      <SelectSheet
        open={actionsOpen}
        title="Review actions"
        searchable={false}
        chevrons
        options={[
          {
            value: 'details',
            label: 'Open transaction details',
            description: 'See and edit every field',
            icon: FileText,
          },
          {
            value: 'ignore',
            label: 'Ignore future SMS',
            description: `Stop importing transactions from ${txn.recipientDisplayName}`,
            icon: EyeOff,
          },
        ]}
        onClose={() => setActionsOpen(false)}
        onSelect={(action) => {
          if (action === 'details') router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } });
          if (action === 'ignore') setIgnoring(true);
        }}
      />
      {ignoring ? <IgnoreRecipient credentials={c} transaction={txn} onClose={() => setIgnoring(false)} /> : null}
      {rulePrompt ? (
        <RulePrompt
          credentials={c}
          selection={rulePrompt}
          onClose={() => {
            setRulePrompt(null);
            void next();
          }}
        />
      ) : null}
    </TransactionPage>
  );
}

function definedDates({ startDate, endDate }: Dates) {
  return startDate && endDate ? { startDate, endDate } : {};
}
const styles = StyleSheet.create({
  headingActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestion: { padding: 14, gap: 10 },
  apply: {
    minHeight: minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  applyText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primaryForeground },
});
