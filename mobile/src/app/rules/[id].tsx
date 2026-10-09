import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { CategorySheet } from '../../components/category-sheet';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { FormField, FormInput, SelectRow } from '../../components/form-controls';
import { useInvalidateRecipientsAndRules } from '../../components/recipients/shared';
import { SelectSheet } from '../../components/select-sheet';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { RecipientPicker } from '../../components/transactions/recipient-picker';
import { TransactionPage, TransactionSession, errorMessage } from '../../components/transactions/shared';
import { Button, Chip, InlineError, Panel, Skeleton, type } from '../../components/ui';
import { ApiError, type Credentials } from '../../lib/api/client';
import { fetchCategories } from '../../lib/api/categories';
import { fetchRecipientDetail } from '../../lib/api/recipients';
import { createRule, deleteRule, fetchRule, updateRule, type Rule, type RuleInput } from '../../lib/api/rules';
import { queryKeys } from '../../lib/query-keys';
import { draftFromRule, newRuleDraft, ruleDraftInput, type RuleDraft } from '../../lib/rule-draft';
import { colors, fonts, minTarget, radii } from '../../theme';

type Conflict = { uuid: string; name: string; input: RuleInput };

const actions = [
  { value: 'CATEGORIZE', label: 'Set category to', description: 'File matching imports under a category' },
  { value: 'IGNORE', label: 'Ignore future SMS', description: 'Skip matching imports entirely' },
];

export default function RuleEditorScreen() {
  const params = useLocalSearchParams<{ id: string; recipientUuid?: string; enable?: string }>();
  const one = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const id = one(params.id) ?? 'new';
  return (
    <TransactionSession>
      {(c) => (
        <Loader
          key={id}
          credentials={c}
          id={id}
          recipientUuid={one(params.recipientUuid)}
          enable={one(params.enable) === '1'}
        />
      )}
    </TransactionSession>
  );
}

function Loader({
  credentials: c,
  id,
  recipientUuid,
  enable,
}: {
  credentials: Credentials;
  id: string;
  recipientUuid?: string;
  enable: boolean;
}) {
  const isNew = id === 'new';
  const rule = useQuery({
    queryKey: [...queryKeys.rules(c.apiUrl), 'detail', id],
    enabled: !isNew,
    queryFn: ({ signal }) => fetchRule(c, id, signal),
  });
  const recipient = useQuery({
    queryKey: queryKeys.recipient(c.apiUrl, recipientUuid ?? ''),
    enabled: isNew && Boolean(recipientUuid),
    queryFn: ({ signal }) => fetchRecipientDetail(c, recipientUuid!, signal),
  });
  const pending = isNew ? Boolean(recipientUuid) && recipient.isPending : rule.isPending;
  const failed = isNew ? recipient.isError : rule.isError;
  if (pending || failed)
    return (
      <TransactionPage title="Rules" heading={isNew ? 'Create rule' : 'Edit rule'}>
        {pending ? (
          <Skeleton height={240} />
        ) : (
          <InlineError
            message={errorMessage(isNew ? recipient.error : rule.error)}
            onRetry={() => void (isNew ? recipient.refetch() : rule.refetch())}
          />
        )}
      </TransactionPage>
    );
  const draft = rule.data ? draftFromRule(rule.data) : newRuleDraft(recipient.data ?? null);
  return (
    <RuleForm
      credentials={c}
      rule={rule.data}
      initial={enable ? { ...draft, isEnabled: true } : draft}
    />
  );
}

function RuleForm({ credentials: c, rule, initial }: { credentials: Credentials; rule?: Rule; initial: RuleDraft }) {
  const [draft, setDraft] = useState(initial);
  const [picker, setPicker] = useState<'recipient' | 'action' | 'category' | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [disabledExisting, setDisabledExisting] = useState(false);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const categories = useQuery({
    queryKey: queryKeys.categories(c.apiUrl),
    queryFn: ({ signal }) => fetchCategories(c, signal),
  });
  // An empty name falls back to the recipient's name.
  const named = { ...draft, name: draft.name.trim() || (draft.recipient?.displayName.slice(0, 100) ?? '') };
  const input = ruleDraftInput(named, categories.data ?? []);
  const category = categories.data?.find((item) => item.uuid === draft.categoryUuid);
  const subcategory = category?.subcategories.find((item) => item.uuid === draft.subcategoryUuid);
  const save = useMutation({
    mutationFn: async ({ input, replaceUuid }: { input: RuleInput; replaceUuid?: string }) => {
      if (replaceUuid) {
        await updateRule(c, replaceUuid, { isEnabled: false });
        setDisabledExisting(true);
      }
      return rule ? updateRule(c, rule.uuid, input) : createRule(c, input);
    },
    onSuccess: () => {
      toast({ message: 'Rule saved for future imports.' });
      router.back();
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.code === 'RULE_RECIPIENT_CONFLICT') {
        const details = error.details as { existingRule?: { uuid?: string; name?: string } } | undefined;
        if (details?.existingRule?.uuid) {
          setConflict({
            uuid: details.existingRule.uuid,
            name: details.existingRule.name ?? 'Existing rule',
            input: variables.input,
          });
          return;
        }
      }
      setConflict(null);
    },
    onSettled: () => invalidate(),
  });
  const remove = useMutation({
    mutationFn: () => deleteRule(c, rule!.uuid),
    onSuccess: async () => {
      await invalidate();
      toast({ message: 'Rule deleted. Existing transactions will not change.' });
      router.back();
    },
  });
  const busy = save.isPending || remove.isPending;
  function change(patch: Partial<RuleDraft>) {
    setDraft({ ...draft, ...patch });
    save.reset();
  }
  return (
    <TransactionPage
      title="Rules"
      heading={rule ? 'Edit rule' : 'Create rule'}
      footer={
        <StickySaveBar
          label="Save rule"
          saving={save.isPending}
          disabled={!input || busy}
          onSave={() => {
            if (input) save.mutate({ input });
          }}
          secondary={{ label: 'Cancel', disabled: busy, onPress: () => router.back() }}
        />
      }
    >
      <Text style={type.muted}>Automatically categorize similar transactions</Text>
      {rule?.actionStatus === 'NEEDS_REPAIR' ? (
        <Panel tone="review" style={styles.notice}>
          <Text style={type.body}>Needs repair: choose a valid category or Ignore before saving.</Text>
        </Panel>
      ) : null}
      <Panel tone="mint" style={styles.section}>
        <View>
          <Text style={type.heading}>If this matches</Text>
          <Text style={type.muted}>Define when this rule should apply</Text>
        </View>
        <SelectRow
          label="Recipient"
          icon={Search}
          chevron="down"
          value={draft.recipient?.displayName}
          placeholder="Choose recipient"
          disabled={busy}
          onPress={() => setPicker('recipient')}
        />
        <Text style={type.muted}>Matches transactions from this recipient.</Text>
      </Panel>
      <Panel tone="mint" style={styles.section}>
        <View>
          <Text style={type.heading}>Then do this</Text>
          <Text style={type.muted}>Set the category and other actions</Text>
        </View>
        <SelectRow
          label="Action"
          chevron="down"
          value={actions.find((item) => item.value === draft.actionType)?.label}
          placeholder="Choose action"
          disabled={busy}
          onPress={() => setPicker('action')}
        />
        {draft.actionType === 'CATEGORIZE' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Category, ${category ? `${category.name}${subcategory ? `, ${subcategory.name}` : ''}` : 'not set'}`}
            disabled={busy || categories.isPending}
            onPress={() => setPicker('category')}
            style={styles.category}
          >
            {category ? (
              <View style={styles.categoryValue}>
                <Chip label={category.name} tone="mint" />
                {subcategory ? (
                  <>
                    <ChevronRight size={14} color={colors.mutedForeground} />
                    <Text style={styles.subcategory} numberOfLines={1}>
                      {subcategory.name}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : (
              <Text style={styles.placeholder}>{categories.isPending ? 'Loading categories…' : 'Choose category'}</Text>
            )}
            <ChevronRight size={18} color={colors.foreground} />
          </Pressable>
        ) : (
          <Text style={type.body}>
            Enabled Ignore rules skip future SMS imports from this recipient. Existing transactions will not change.
          </Text>
        )}
        {categories.isError ? (
          <InlineError message={errorMessage(categories.error)} onRetry={() => void categories.refetch()} />
        ) : null}
        {draft.actionType === 'CATEGORIZE' && draft.categoryUuid && !category && categories.isSuccess ? (
          <Text style={type.error}>The saved category is unavailable. Choose a category.</Text>
        ) : null}
        {draft.actionType === 'CATEGORIZE' && draft.subcategoryUuid && !subcategory && category ? (
          <Text style={type.error}>The saved subcategory is unavailable. Choose a subcategory or None.</Text>
        ) : null}
        <View style={styles.toggle}>
          <View style={styles.flex}>
            <Text style={styles.toggleLabel}>Rule enabled</Text>
            <Text style={type.muted}>Apply this rule to future imports</Text>
          </View>
          <Switch
            accessibilityLabel="Rule enabled"
            value={draft.isEnabled}
            disabled={busy}
            trackColor={{ true: colors.primary, false: colors.muted }}
            thumbColor={colors.card}
            onValueChange={(isEnabled) => change({ isEnabled })}
          />
        </View>
      </Panel>
      <FormField label="Rule name" optional>
        <FormInput
          accessibilityLabel="Rule name"
          placeholder={draft.recipient ? `e.g. ${draft.recipient.displayName}` : 'e.g. Amazon Shopping'}
          value={draft.name}
          maxLength={100}
          editable={!busy}
          onChangeText={(name) => change({ name })}
        />
      </FormField>
      <Text style={type.muted}>Rules apply to future imports. Existing transactions will not change.</Text>
      {save.isError ? (
        <Text accessibilityRole="alert" style={type.error}>
          {disabledExisting
            ? 'The previous rule was disabled, but this rule was not saved. Retry saving or re-enable the previous rule. '
            : ''}
          {errorMessage(save.error)}
        </Text>
      ) : null}
      {rule ? (
        <Panel tone="blush" style={styles.notice}>
          <Text style={type.heading}>Danger zone</Text>
          <Button label="Delete rule" variant="destructive" disabled={busy} onPress={() => setDeleting(true)} />
          {remove.isError ? (
            <Text accessibilityRole="alert" style={type.error}>
              {errorMessage(remove.error)}
            </Text>
          ) : null}
        </Panel>
      ) : null}
      {picker === 'recipient' ? (
        <RecipientPicker
          credentials={c}
          onClose={() => setPicker(null)}
          onSelect={(recipient) => change({ recipient })}
        />
      ) : null}
      <SelectSheet
        open={picker === 'action'}
        title="Then do this"
        searchable={false}
        options={actions}
        selected={draft.actionType}
        onClose={() => setPicker(null)}
        onSelect={(value) => change({ actionType: value as RuleDraft['actionType'] })}
      />
      <CategorySheet
        open={picker === 'category'}
        categories={categories.data ?? []}
        selected={draft.categoryUuid}
        selectedSubcategory={draft.subcategoryUuid}
        onClose={() => setPicker(null)}
        onSelect={(categoryUuid, subcategoryUuid) => change({ categoryUuid, subcategoryUuid })}
      />
      <ConfirmDialog
        open={Boolean(conflict)}
        title="Replace existing rule?"
        message={
          conflict
            ? `Disable "${conflict.name}" and save this rule for the recipient? Existing transactions will not change.`
            : ''
        }
        confirmLabel="Replace rule"
        busy={save.isPending}
        onClose={() => {
          setConflict(null);
          save.reset();
        }}
        onConfirm={() => {
          if (conflict) save.mutate({ input: conflict.input, replaceUuid: conflict.uuid });
        }}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete rule?"
        message="Existing transactions will not change."
        confirmLabel="Delete rule"
        destructive
        busy={remove.isPending}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
      />
      <Modal visible={busy && !conflict && !deleting} transparent onRequestClose={() => undefined}>
        <View style={styles.overlay}>
          <Panel raised style={styles.saving}>
            <Text style={type.body}>Saving rule…</Text>
          </Panel>
        </View>
      </Modal>
    </TransactionPage>
  );
}

const styles = StyleSheet.create({
  notice: { padding: 12, gap: 12 },
  section: { padding: 14, gap: 10 },
  category: {
    minHeight: minTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  categoryValue: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  subcategory: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.foreground },
  placeholder: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: `${colors.foreground}80` },
  saving: { padding: 20 },
});
