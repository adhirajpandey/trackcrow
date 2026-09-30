import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { Button, InlineError, Panel, type } from '../../components/ui';
import { AmountEntry, TransactionFields } from '../../components/transactions/form-fields';
import { RecipientPicker, type SelectedRecipient } from '../../components/transactions/recipient-picker';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
  useTransactionOptions,
} from '../../components/transactions/shared';
import { createTransaction } from '../../lib/api/transactions';
import { draftInput, transactionDraft } from '../../lib/transaction-draft';
import type { Credentials } from '../../lib/api/client';
export default function NewTransactionScreen() {
  return (
    <TransactionSession>{(credentials) => <NewTransaction credentials={credentials} />}</TransactionSession>
  );
}
function NewTransaction({ credentials: c }: { credentials: Credentials }) {
  const [draft, setDraft] = useState(() => transactionDraft());
  const [recipient, setRecipient] = useState<SelectedRecipient | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const options = useTransactionOptions(c),
    toast = useToast(),
    invalidate = useInvalidateLedger(c);
  const input = draftInput(draft);
  const save = useMutation({
    mutationFn: () => createTransaction(c, { ...input!, recipientUuid: recipient!.uuid }),
    onSuccess: async () => {
      await invalidate();
      toast({ message: 'Transaction added.' });
      router.dismissTo('/(tabs)/transactions');
    },
  });
  return (
    <TransactionPage
      title="Add transaction"
      footer={
        <StickySaveBar
          label="Add transaction"
          saving={save.isPending}
          disabled={!input || !recipient}
          onSave={() => save.mutate()}
        />
      }
    >
      <Panel tone="mint" style={{ padding: 16 }}>
        <AmountEntry draft={draft} onChange={setDraft} autoFocus disabled={save.isPending} />
      </Panel>
      <Panel style={{ padding: 12, gap: 8 }}>
        <Text style={type.label}>Recipient</Text>
        <Button
          label={recipient?.displayName ?? 'Choose or create recipient'}
          variant="secondary"
          disabled={save.isPending}
          onPress={() => setPickerOpen(true)}
        />
      </Panel>
      <TransactionFields
        draft={draft}
        onChange={setDraft}
        categories={options.categories.data ?? []}
        accounts={options.accounts.data ?? []}
        disabled={save.isPending}
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
      {pickerOpen ? (
        <RecipientPicker credentials={c} onSelect={setRecipient} onClose={() => setPickerOpen(false)} />
      ) : null}
    </TransactionPage>
  );
}
