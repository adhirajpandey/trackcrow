import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMutation } from '@tanstack/react-query';
import { openRule } from '../rules/open-rule';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { ApiError, type Credentials } from '../../lib/api/client';
import { addRecipientAlias, type AliasInput, type AliasTransferImpact } from '../../lib/api/recipients';
import { formatCurrency } from '../../lib/format';
import { ConfirmDialog } from '../confirm-dialog';
import { Sheet } from '../sheet';
import { SheetTextField } from './sheet-text-field';
import { useToast } from '../toast-host';
import { Button, Panel, type } from '../ui';
import { colors } from '../../theme';
import { errorMessage } from '../transactions/shared';
import { useInvalidateRecipientsAndRules } from './shared';

export function AliasSheet({ credentials: c, recipientUuid, onClose }: {
  credentials: Credentials; recipientUuid: string; onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [aliasType, setType] = useState<AliasInput['aliasType']>('UPI_ID');
  const [impact, setImpact] = useState<AliasTransferImpact | null>(null);
  const [ruleConflict, setRuleConflict] = useState<string | null>(null);
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const save = useMutation({
    mutationFn: (transfer: boolean) => addRecipientAlias(c, recipientUuid, { value: value.trim(), aliasType, transfer }),
    onSuccess: async result => {
      await invalidate();
      toast({ message: result.status === 'already_linked' ? 'Alias already linked.' :
        result.status === 'moved' ? `Alias moved. ${result.movedTransactionCount} transactions moved${result.deletedSourceRecipient ? '; source recipient merged' : ''}.` : 'Alias added.' });
      onClose();
    },
    onError: error => {
      void invalidate();
      setImpact(null);
      if (error instanceof ApiError && error.status === 409) {
        if (error.code === 'RULE_RECIPIENT_CONFLICT') {
          const details = error.details as { existingRule?: { uuid?: string } } | undefined;
          setRuleConflict(details?.existingRule?.uuid ?? null);
        } else {
          const details = error.details as AliasTransferImpact | undefined;
          if (details?.sourceRecipient && typeof details.transactionCount === 'number') setImpact(details);
        }
      }
    },
  });
  return <>
    <Sheet open title="Add alias" onClose={() => { if (!save.isPending) onClose(); }}>
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['UPI_ID', 'CARD_MERCHANT', 'TEXT'] as const).map(kind => <Button key={kind}
            label={`${aliasType === kind ? '✓ ' : ''}${kind.replaceAll('_', ' ')}`}
            variant="secondary" disabled={save.isPending} onPress={() => { setType(kind); save.reset(); setRuleConflict(null); }} />)}
        </View>
        <SheetTextField label="Alias" value={value} autoCapitalize="none" maxLength={200} editable={!save.isPending}
          onChangeText={text => { setValue(text); save.reset(); setRuleConflict(null); }} />
        {save.isError ? <Text accessibilityRole="alert" style={type.error}>{errorMessage(save.error)}</Text> : null}
        {ruleConflict ? <>
          <Text style={type.body}>Both recipients have enabled rules. Resolve the rule conflict before merging, then retry adding the alias.</Text>
          <Button label="Open target rule" variant="secondary" onPress={() => {
            onClose(); openRule(ruleConflict);
          }} />
        </> : null}
        <Button label={save.isPending ? 'Adding…' : 'Add alias'} disabled={!value.trim() || save.isPending}
          onPress={() => save.mutate(false)} />
      </BottomSheetScrollView>
    </Sheet>
    <ConfirmDialog open={Boolean(impact)} title="Move alias or merge recipients?"
      message={impact ? `${impact.alias.value} belongs to ${impact.sourceRecipient.displayName}. Move it to ${impact.targetRecipient.displayName} with ${impact.transactionCount} matching transactions (${formatCurrency(impact.totalAmount)})? If no aliases or transactions remain, the source recipient will be merged.` : ''}
      confirmLabel="Move alias" busy={save.isPending} onClose={() => setImpact(null)} onConfirm={() => save.mutate(true)} />
    <Modal visible={save.isPending && !impact} transparent onRequestClose={() => undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: `${colors.foreground}80` }}>
        <Panel raised style={{ padding: 20 }}><Text style={type.body}>Adding alias…</Text></Panel>
      </View>
    </Modal>
  </>;
}
