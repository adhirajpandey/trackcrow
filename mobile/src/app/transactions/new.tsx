import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { SelectRow } from '../../components/form-controls';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { InlineError, type } from '../../components/ui';
import { TransactionFormFields } from '../../components/transactions/form-fields';
import { RecipientPicker, type SelectedRecipient } from '../../components/transactions/recipient-picker';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
  useTransactionOptions,
} from '../../components/transactions/shared';
import { createTransaction } from '../../lib/api/transactions';
import type { Credentials } from '../../lib/api/client';
import { draftInput, transactionDraft } from '../../lib/transaction-draft';

export default function NewTransactionScreen() {
  return (
    <TransactionSession>{(credentials) => <NewTransaction credentials={credentials} />}</TransactionSession>
  );
}

function NewTransaction({ credentials: c }: { credentials: Credentials }) {
  const [draft, setDraft] = useState(() => transactionDraft());
  const [recipient, setRecipient] = useState<SelectedRecipient | null>(null);
  const [recipientOpen, setRecipientOpen] = useState(false);
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
  const disabled = save.isPending;
  return (
    <TransactionPage
      title="Transactions"
      heading="Add Transaction"
      footer={
        <StickySaveBar
          label="Save transaction"
          saving={save.isPending}
          disabled={!input || !recipient}
          onSave={() => save.mutate()}
        />
      }
    >
      <TransactionFormFields
        draft={draft}
        onChange={setDraft}
        categories={options.categories.data ?? []}
        accounts={options.accounts.data ?? []}
        required
        autoFocusAmount
        disabled={disabled}
        recipient={
          <SelectRow
            label="Recipient"
            icon={Search}
            chevron="none"
            value={recipient?.displayName}
            placeholder="Search or enter manually"
            disabled={disabled}
            onPress={() => setRecipientOpen(true)}
            onClear={() => setRecipient(null)}
          />
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
      {recipientOpen ? (
        <RecipientPicker credentials={c} onSelect={setRecipient} onClose={() => setRecipientOpen(false)} />
      ) : null}
    </TransactionPage>
  );
}
