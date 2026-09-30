import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Sheet } from '../sheet';
import { Button, InlineError, Panel, type } from '../ui';
import { useToast } from '../toast-host';
import { ApiError, getJson, type Credentials } from '../../lib/api/client';
import { createRule, updateRule } from '../../lib/api/rules';
import { categorizeTransaction, fetchTransactions, type Transaction } from '../../lib/api/transactions';
import { errorMessage, useInvalidateLedger } from './shared';
import { colors } from '../../theme';
type RecipientContext = { existingRuleUuid: string | null; stats: { uncategorizedCount: number } };
export type RulePromptSelection = {
  transaction: Transaction;
  categoryUuid: string;
  category: string;
  subcategoryUuid?: string | null;
};
export function RulePrompt({
  credentials: c,
  selection,
  onClose,
}: {
  credentials: Credentials;
  selection: RulePromptSelection;
  onClose: () => void;
}) {
  const { transaction: txn } = selection;
  const [alsoFile, setAlsoFile] = useState(false);
  const [conflictingRule, setConflictingRule] = useState<string | null>(null);
  const [ruleSaved, setRuleSaved] = useState(false);
  const [remainingIds, setRemainingIds] = useState<string[] | null>(null);
  const [progress, setProgress] = useState('');
  const [filedTotal, setFiledTotal] = useState(0);
  const toast = useToast();
  const invalidate = useInvalidateLedger(c);
  const context = useQuery({
    queryKey: ['recipient', c.apiUrl, txn.recipientUuid, 'automation'],
    queryFn: ({ signal }) =>
      getJson<RecipientContext>(c, `/api/recipients/${encodeURIComponent(txn.recipientUuid)}/detail`, signal),
  });
  const existing = conflictingRule ?? context.data?.existingRuleUuid;
  const count = context.data?.stats.uncategorizedCount ?? 0;
  const save = useMutation({
    mutationFn: async () => {
      // Snapshot matching IDs before changing categories; mutating during page traversal skips rows.
      let ids = alsoFile ? remainingIds : null;
      if (alsoFile && ids === null) {
        ids = [];
        let page = 1;
        while (true) {
          const result = await fetchTransactions(c, {
            recipientUuid: txn.recipientUuid,
            category: ['Uncategorized'],
            page,
            size: 100,
          });
          ids.push(...result.transactions.map((row) => row.uuid));
          if (!result.hasNext) break;
          page++;
        }
        ids = [...new Set(ids)];
        setRemainingIds(ids);
      }
      if (!ruleSaved) {
        const input = {
          name: `File ${txn.recipientDisplayName} under ${selection.category}`.slice(0, 100),
          isEnabled: true,
          conditions: { recipient: { equals: txn.recipientUuid } },
          action: {
            type: 'CATEGORIZE' as const,
            categoryUuid: selection.categoryUuid,
            subcategoryUuid: selection.subcategoryUuid ?? null,
          },
        };
        if (existing) await updateRule(c, existing, input);
        else await createRule(c, input);
        setRuleSaved(true);
      }
      const pending = [...(ids ?? [])];
      let filed = filedTotal;
      while (pending.length) {
        const id = pending[0];
        // Refresh membership so retrying does not overwrite a later classification.
        let row: Transaction | null;
        try {
          row = await getJson<Transaction>(c, `/api/transactions/${encodeURIComponent(id)}`);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) row = null;
          else throw error;
        }
        if (row && !row.categoryUuid && row.recipientUuid === txn.recipientUuid) {
          await categorizeTransaction(c, id, {
            categoryUuid: selection.categoryUuid,
            subcategoryUuid: selection.subcategoryUuid ?? null,
          });
          filed++;
          setFiledTotal(filed);
        }
        pending.shift();
        setRemainingIds([...pending]);
        setProgress(`${filed} filed · ${pending.length} left`);
      }
      return filed;
    },
    onSuccess: (filed) => {
      toast({
        message: filed ? `Rule saved. Filed ${filed} transactions.` : 'Rule saved for future imports.',
      });
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'RULE_RECIPIENT_CONFLICT') {
        const details = error.details as { existingRule?: { uuid?: string } } | undefined;
        if (details?.existingRule?.uuid) setConflictingRule(details.existingRule.uuid);
      }
    },
    onSettled: () => invalidate(),
  });
  return (
    <>
      <Sheet
        open
        title="Automate classification"
        onClose={() => {
          if (!save.isPending) onClose();
        }}
      >
        <BottomSheetScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          <Text style={type.heading}>
            Always file {txn.recipientDisplayName} under {selection.category}?
          </Text>
          <Text style={type.body}>Future imports from this recipient will use {selection.category}.</Text>
          {existing ? (
            <Text style={type.body}>
              This recipient already has a rule. Replace its action with this category?
            </Text>
          ) : null}
          {context.isError ? (
            <InlineError message={errorMessage(context.error)} onRetry={() => void context.refetch()} />
          ) : null}
          {count > 0 ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: alsoFile, disabled: save.isPending || ruleSaved }}
              disabled={save.isPending || ruleSaved}
              onPress={() => {
                setAlsoFile(!alsoFile);
                setRemainingIds(null);
              }}
              style={{ minHeight: 44, paddingVertical: 8 }}
            >
              <Text style={type.body}>
                {alsoFile ? '☑' : '☐'} Also file {count} uncategorized from {txn.recipientDisplayName}
              </Text>
            </Pressable>
          ) : null}
          {progress ? (
            <Text accessibilityLiveRegion="polite" style={type.muted}>
              {progress}
            </Text>
          ) : null}
          {save.isError ? (
            <Text accessibilityRole="alert" style={type.error}>
              {ruleSaved ? 'Rule saved. Some entries remain; retry to continue. ' : ''}
              {errorMessage(save.error)}
            </Text>
          ) : null}
          <Button
            label={
              save.isPending
                ? 'Saving…'
                : ruleSaved
                  ? 'Retry remaining entries'
                  : existing
                    ? 'Replace rule'
                    : 'Create rule'
            }
            disabled={save.isPending || !context.data}
            onPress={() => save.mutate()}
          />
          <Button label="Not now" variant="secondary" disabled={save.isPending} onPress={onClose} />
        </BottomSheetScrollView>
      </Sheet>
      <Modal visible={save.isPending} transparent onRequestClose={() => undefined}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: `${colors.foreground}80`,
          }}
        >
          <Panel raised tone="mint" style={{ padding: 20, gap: 12 }}>
            <Text accessibilityRole="header" style={type.heading}>
              Saving rule and classification…
            </Text>
            <Text accessibilityLiveRegion="polite" style={type.body}>
              {progress || 'Preparing the rule…'}
            </Text>
          </Panel>
        </View>
      </Modal>
    </>
  );
}
