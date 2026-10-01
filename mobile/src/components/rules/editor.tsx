import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Switch, Text, View } from 'react-native';
import { ApiError, type Credentials } from '../../lib/api/client';
import { fetchCategories } from '../../lib/api/categories';
import { createRule, deleteRule, updateRule, type Rule, type RuleInput } from '../../lib/api/rules';
import { queryKeys } from '../../lib/query-keys';
import { draftFromRule, newRuleDraft, ruleDraftInput, type RuleDraft } from '../../lib/rule-draft';
import { CategorySheet } from '../category-sheet';
import { ConfirmDialog } from '../confirm-dialog';
import { SelectSheet } from '../select-sheet';
import { Sheet } from '../sheet';
import { SheetTextField } from '../recipients/sheet-text-field';
import { useToast } from '../toast-host';
import { Button, InlineError, Panel, type } from '../ui';
import { RecipientPicker } from '../transactions/recipient-picker';
import { errorMessage } from '../transactions/shared';
import { useInvalidateRecipientsAndRules } from '../recipients/shared';
import { colors } from '../../theme';

export type RuleEditorSelection = { rule?: Rule; recipient?: RuleDraft['recipient'] };
type Conflict = { uuid: string; name: string; input: RuleInput };
export function RuleEditor({ credentials: c, selection, onClose }: {
  credentials: Credentials; selection: RuleEditorSelection; onClose: () => void;
}) {
  const rule = selection.rule;
  const [draft, setDraft] = useState(() => rule ? draftFromRule(rule) : newRuleDraft(selection.recipient));
  const [picker, setPicker] = useState<'recipient' | 'category' | 'subcategory' | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disabledExisting, setDisabledExisting] = useState(false);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const categories = useQuery({
    queryKey: queryKeys.categories(c.apiUrl), queryFn: ({ signal }) => fetchCategories(c, signal),
  });
  const input = ruleDraftInput(draft, categories.data ?? []);
  const category = categories.data?.find(item => item.uuid === draft.categoryUuid);
  const subcategory = category?.subcategories.find(item => item.uuid === draft.subcategoryUuid);
  const save = useMutation({
    mutationFn: async ({ input, replaceUuid }: { input: RuleInput; replaceUuid?: string }) => {
      if (replaceUuid) {
        await updateRule(c, replaceUuid, { isEnabled: false });
        setDisabledExisting(true);
      }
      return rule ? updateRule(c, rule.uuid, input) : createRule(c, input);
    },
    onSuccess: () => {
      toast({ message: 'Rule saved for future imports.' }); onClose();
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.code === 'RULE_RECIPIENT_CONFLICT') {
        const details = error.details as { existingRule?: { uuid?: string; name?: string } } | undefined;
        if (details?.existingRule?.uuid) {
          setConflict({ uuid: details.existingRule.uuid, name: details.existingRule.name ?? 'Existing rule', input: variables.input });
          return;
        }
      }
      setConflict(null);
    },
    onSettled: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: () => deleteRule(c, rule!.uuid),
    onSuccess: async () => { await invalidate(); toast({ message: 'Rule deleted. Existing transactions will not change.' }); onClose(); },
  });
  const busy = save.isPending || remove.isPending;
  function change(patch: Partial<RuleDraft>) { setDraft({ ...draft, ...patch }); save.reset(); }
  return <>
    <Sheet open title={rule ? 'Edit rule' : 'Create rule'} onClose={() => { if (!busy) onClose(); }}>
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {rule?.actionStatus === 'NEEDS_REPAIR' ? <Panel tone="review" style={{ padding: 12 }}>
          <Text style={type.body}>Needs repair: choose a valid category or Ignore before saving.</Text>
        </Panel> : null}
        <SheetTextField label="Rule name" value={draft.name} maxLength={100} editable={!busy}
          onChangeText={name => change({ name })} hint={`${draft.name.length}/100 characters`} />
        <Button label={draft.recipient?.displayName ?? 'Choose recipient'} variant="secondary"
          disabled={busy} onPress={() => setPicker('recipient')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['CATEGORIZE', 'IGNORE'] as const).map(actionType => <Button key={actionType}
            label={`${draft.actionType === actionType ? '✓ ' : ''}${actionType === 'IGNORE' ? 'Ignore' : 'Categorize'}`}
            variant="secondary" disabled={busy} onPress={() => change({ actionType })} />)}
        </View>
        {draft.actionType === 'CATEGORIZE' ? <>
          <Button label={category?.name ?? 'Choose category'} variant="secondary" disabled={busy || categories.isPending}
            onPress={() => setPicker('category')} />
          {category ? <Button label={subcategory?.name ?? 'Subcategory · None'} variant="secondary"
            disabled={busy} onPress={() => setPicker('subcategory')} /> : null}
          {categories.isPending ? <Text style={type.muted}>Loading categories…</Text> : null}
          {categories.isError ? <InlineError message={errorMessage(categories.error)}
            onRetry={() => void categories.refetch()} /> : null}
          {draft.categoryUuid && !category && categories.isSuccess ?
            <Text style={type.error}>The saved category is unavailable. Choose a category.</Text> : null}
          {draft.subcategoryUuid && !subcategory && category ?
            <Text style={type.error}>The saved subcategory is unavailable. Choose a subcategory or None.</Text> : null}
        </> : <Text style={type.body}>Enabled Ignore rules skip future SMS imports from this recipient. Existing transactions will not change.</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <Text style={type.body}>Enabled</Text>
          <Switch accessibilityLabel="Rule enabled" value={draft.isEnabled} disabled={busy}
            onValueChange={isEnabled => change({ isEnabled })} />
        </View>
        <Text style={type.muted}>Rules apply to future imports. Existing transactions will not change.</Text>
        {save.isError ? <Text accessibilityRole="alert" style={type.error}>
          {disabledExisting ? 'The previous rule was disabled, but this rule was not saved. Retry saving or re-enable the previous rule. ' : ''}
          {errorMessage(save.error)}
        </Text> : null}
        {!input ? <Text style={type.muted}>Enter a name, recipient, and a valid action to save.</Text> : null}
        <Button label={save.isPending ? 'Saving…' : 'Save rule'} disabled={!input || busy}
          onPress={() => { if (input) save.mutate({ input }); }} />
        {rule ? <Panel tone="blush" style={{ padding: 12, gap: 12 }}>
          <Text style={type.heading}>Danger zone</Text>
          <Button label="Delete rule" variant="destructive" disabled={busy} onPress={() => setDeleting(true)} />
          {remove.isError ? <Text accessibilityRole="alert" style={type.error}>{errorMessage(remove.error)}</Text> : null}
        </Panel> : null}
      </BottomSheetScrollView>
    </Sheet>
    {picker === 'recipient' ? <RecipientPicker credentials={c} onClose={() => setPicker(null)}
      onSelect={recipient => change({ recipient })} /> : null}
    <CategorySheet open={picker === 'category'} categories={categories.data ?? []} selected={draft.categoryUuid}
      onClose={() => setPicker(null)} onSelect={categoryUuid => change({ categoryUuid, subcategoryUuid: null })} />
    <SelectSheet open={picker === 'subcategory'} title="Subcategory" selected={draft.subcategoryUuid ?? ''}
      options={[{ value: '', label: 'None' }, ...(category?.subcategories ?? []).map(item => ({ value: item.uuid, label: item.name }))]}
      onClose={() => setPicker(null)} onSelect={value => change({ subcategoryUuid: value || null })} />
    <ConfirmDialog open={Boolean(conflict)} title="Replace existing rule?"
      message={conflict ? `Disable "${conflict.name}" and save this rule for the recipient? Existing transactions will not change.` : ''}
      confirmLabel="Replace rule" busy={save.isPending} onClose={() => { setConflict(null); save.reset(); }}
      onConfirm={() => { if (conflict) save.mutate({ input: conflict.input, replaceUuid: conflict.uuid }); }} />
    <ConfirmDialog open={deleting} title="Delete rule?" message="Existing transactions will not change."
      confirmLabel="Delete rule" destructive busy={remove.isPending} onClose={() => setDeleting(false)}
      onConfirm={() => remove.mutate()} />
    <Modal visible={busy && !conflict && !deleting} transparent onRequestClose={() => undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: `${colors.foreground}80` }}>
        <Panel raised style={{ padding: 20 }}><Text style={type.body}>Saving rule…</Text></Panel>
      </View>
    </Modal>
  </>;
}
