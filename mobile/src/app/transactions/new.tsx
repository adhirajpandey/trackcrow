import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Calendar, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { FormField, FormInput, SelectRow } from '../../components/form-controls';
import { StickySaveBar } from '../../components/sticky-save-bar';
import { useToast } from '../../components/toast-host';
import { InlineError, type } from '../../components/ui';
import {
  TransactionPickers,
  amountError,
  openIstPicker,
  type TransactionPicker,
} from '../../components/transactions/form-fields';
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
import { dayLabel, istDateKey, parseIstDateTime } from '../../lib/transaction-dates';

export default function NewTransactionScreen() {
  return (
    <TransactionSession>{(credentials) => <NewTransaction credentials={credentials} />}</TransactionSession>
  );
}

function NewTransaction({ credentials: c }: { credentials: Credentials }) {
  const [draft, setDraft] = useState(() => transactionDraft());
  const [recipient, setRecipient] = useState<SelectedRecipient | null>(null);
  const [picker, setPicker] = useState<TransactionPicker | 'recipient' | null>(null);
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
  const categories = options.categories.data ?? [];
  const accounts = options.accounts.data ?? [];
  const category = categories.find((item) => item.uuid === draft.categoryUuid);
  const subcategory = category?.subcategories.find((item) => item.uuid === draft.subcategoryUuid);
  const account = accounts.find((item) => item.uuid === draft.accountUuid);
  const dateKey = draft.time.slice(0, 10);
  const dateText = parseIstDateTime(draft.time)
    ? `${dateKey === istDateKey(new Date()) ? 'Today, ' : ''}${dayLabel(dateKey)} · ${draft.time.slice(11)}`
    : undefined;
  const setTime = (time: string) => setDraft((old) => ({ ...old, time }));
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
      <FormField label="Amount" required error={amountError(draft.amount)}>
        <FormInput
          prefix="₹"
          accessibilityLabel="Amount in rupees"
          placeholder="0"
          keyboardType="decimal-pad"
          autoFocus
          editable={!disabled}
          value={draft.amount}
          onChangeText={(amount) => setDraft((old) => ({ ...old, amount }))}
        />
      </FormField>
      <FormField label="Date" required>
        <SelectRow
          label="Date and time"
          icon={Calendar}
          chevron="down"
          value={dateText}
          placeholder="Choose a date"
          disabled={disabled}
          onPress={() =>
            openIstPicker('date', draft.time, (time) => {
              setTime(time);
              openIstPicker('time', time, setTime);
            })
          }
        />
      </FormField>
      <FormField label="Recipient / Merchant" required>
        <SelectRow
          label="Recipient"
          icon={Search}
          chevron="none"
          value={recipient?.displayName}
          placeholder="Search or enter manually"
          disabled={disabled}
          onPress={() => setPicker('recipient')}
          onClear={() => setRecipient(null)}
        />
      </FormField>
      <FormField label="Category" optional>
        <SelectRow
          label="Category"
          value={category?.name}
          placeholder="Select category"
          chosen={Boolean(category)}
          disabled={disabled}
          onPress={() => setPicker('category')}
          onClear={() => setDraft((old) => ({ ...old, categoryUuid: null, subcategoryUuid: null }))}
        />
      </FormField>
      <FormField label="Subcategory" optional>
        <SelectRow
          label="Subcategory"
          value={subcategory?.name}
          placeholder="Select subcategory"
          chosen={Boolean(subcategory)}
          disabled={disabled || !category}
          onPress={() => setPicker('subcategory')}
        />
      </FormField>
      <FormField label="Payment Method">
        <SelectRow
          label="Payment method"
          value={draft.type}
          placeholder="Select payment method"
          disabled={disabled}
          onPress={() => setPicker('type')}
        />
      </FormField>
      <FormField label="Account" optional>
        <SelectRow
          label="Account"
          value={account?.name}
          placeholder="Select account"
          disabled={disabled}
          onPress={() => setPicker('account')}
        />
      </FormField>
      <FormField label="Remarks" optional>
        <FormInput
          accessibilityLabel="Remarks"
          placeholder="Add remarks…"
          multiline
          editable={!disabled}
          value={draft.remarks}
          onChangeText={(remarks) => setDraft((old) => ({ ...old, remarks }))}
        />
      </FormField>
      <FormField label="Reference" optional>
        <FormInput
          accessibilityLabel="Reference"
          placeholder="UPI or bank reference"
          editable={!disabled}
          value={draft.reference}
          onChangeText={(reference) => setDraft((old) => ({ ...old, reference }))}
        />
      </FormField>
      <FormField label="Location" optional>
        <FormInput
          accessibilityLabel="Location"
          placeholder="Where it happened"
          editable={!disabled}
          value={draft.locationRaw}
          onChangeText={(locationRaw) => setDraft((old) => ({ ...old, locationRaw }))}
        />
      </FormField>
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
      {picker === 'recipient' ? (
        <RecipientPicker credentials={c} onSelect={setRecipient} onClose={() => setPicker(null)} />
      ) : null}
      <TransactionPickers
        picker={picker === 'recipient' ? null : picker}
        draft={draft}
        onChange={setDraft}
        onClose={() => setPicker(null)}
        categories={categories}
        accounts={accounts}
      />
    </TransactionPage>
  );
}
