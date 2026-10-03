import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Category } from '../../lib/api/categories';
import type { Account } from '../../lib/api/accounts';
import type { TransactionType } from '../../lib/api/transactions';
import type { TransactionDraft } from '../../lib/transaction-draft';
import { istDateTime, parseIstDateTime } from '../../lib/transaction-dates';
import { AmountField } from '../amount-field';
import { TextField } from '../text-field';
import { CategorySheet } from '../category-sheet';
import { SelectSheet } from '../select-sheet';
import { Button, Chip, Panel, type } from '../ui';
export const paymentTypes: TransactionType[] = ['UPI', 'CARD', 'CASH', 'NETBANKING', 'OTHER'];

export type TransactionPicker = 'category' | 'subcategory' | 'type' | 'account';

export function amountError(amount: string) {
  return amount && (!Number.isFinite(Number(amount)) || Number(amount) <= 0) ? 'Enter an amount above zero.' : undefined;
}

export function openIstPicker(mode: 'date' | 'time', time: string, onPick: (time: string) => void) {
  DateTimePickerAndroid.open({
    value: new Date(parseIstDateTime(time) ?? Date.now()),
    mode,
    is24Hour: true,
    timeZoneName: 'Asia/Kolkata',
    onValueChange: (_event, date) => {
      if (date) onPick(istDateTime(date.toISOString()));
    },
  });
}

export function TransactionPickers({
  picker,
  draft,
  onChange,
  onClose,
  categories,
  accounts,
}: {
  picker: TransactionPicker | null;
  draft: TransactionDraft;
  onChange: (draft: TransactionDraft) => void;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
}) {
  const category = categories.find((item) => item.uuid === draft.categoryUuid);
  return (
    <>
      <CategorySheet
        open={picker === 'category'}
        categories={categories}
        selected={draft.categoryUuid}
        selectedSubcategory={draft.subcategoryUuid}
        onClose={onClose}
        onSelect={(categoryUuid, subcategoryUuid) => onChange({ ...draft, categoryUuid, subcategoryUuid })}
      />
      <SelectSheet
        open={picker === 'subcategory'}
        title="Subcategory"
        selected={draft.subcategoryUuid ?? ''}
        options={[
          { value: '', label: 'None' },
          ...(category?.subcategories ?? []).map((sub) => ({ value: sub.uuid, label: sub.name })),
        ]}
        onClose={onClose}
        onSelect={(value) => onChange({ ...draft, subcategoryUuid: value || null })}
      />
      <SelectSheet
        open={picker === 'account'}
        title="Account"
        selected={draft.accountUuid ?? ''}
        options={[{ value: '', label: 'None' }, ...accounts.map((item) => ({ value: item.uuid, label: item.name }))]}
        onClose={onClose}
        onSelect={(value) => onChange({ ...draft, accountUuid: value || null })}
      />
      <SelectSheet
        open={picker === 'type'}
        title="Payment type"
        selected={draft.type}
        options={paymentTypes.map((value) => ({ value, label: value }))}
        onClose={onClose}
        onSelect={(value) => onChange({ ...draft, type: value as TransactionType })}
      />
    </>
  );
}

export function AmountEntry({
  draft,
  onChange,
  autoFocus = false,
  disabled = false,
}: {
  draft: TransactionDraft;
  onChange: (draft: TransactionDraft) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  return (
    <AmountField
      value={draft.amount}
      onChangeText={(amount) => onChange({ ...draft, amount })}
      autoFocus={autoFocus}
      editable={!disabled}
      error={amountError(draft.amount)}
    />
  );
}
export function TransactionFields({
  draft,
  onChange,
  categories,
  accounts,
  classification = true,
  disabled = false,
}: {
  draft: TransactionDraft;
  onChange: (draft: TransactionDraft) => void;
  categories: Category[];
  accounts: Account[];
  classification?: boolean;
  disabled?: boolean;
}) {
  const [picker, setPicker] = useState<TransactionPicker | null>(null);
  const category = categories.find((item) => item.uuid === draft.categoryUuid);
  const account = accounts.find((item) => item.uuid === draft.accountUuid);
  return (
    <>
      {classification ? (
        <Panel tone={category ? 'mint' : 'review'} style={{ padding: 12, gap: 12 }}>
          <Text style={type.label}>Category (optional)</Text>
          <Button
            label={category?.name ?? 'Choose category'}
            variant="secondary"
            disabled={disabled}
            onPress={() => setPicker('category')}
          />
          {category ? (
            <>
              <Button
                label={
                  category.subcategories.find((sub) => sub.uuid === draft.subcategoryUuid)?.name ??
                  'Choose subcategory (optional)'
                }
                variant="secondary"
                disabled={disabled}
                onPress={() => setPicker('subcategory')}
              />
              <Button
                label="Clear category"
                variant="secondary"
                disabled={disabled}
                onPress={() => onChange({ ...draft, categoryUuid: null, subcategoryUuid: null })}
              />
            </>
          ) : (
            <Chip label="Needs classification" tone="uncategorized" />
          )}
        </Panel>
      ) : null}
      <Panel style={{ padding: 12, gap: 12 }}>
        <Text style={type.label}>Payment details</Text>
        <Button
          label={`Type: ${draft.type}`}
          variant="secondary"
          disabled={disabled}
          onPress={() => setPicker('type')}
        />
        <Button
          label={`Account: ${account?.name ?? 'None'}`}
          variant="secondary"
          disabled={disabled}
          onPress={() => setPicker('account')}
        />
        <TextField
          label="Date and time (IST)"
          hint="YYYY-MM-DD HH:mm"
          value={draft.time}
          editable={!disabled}
          onChangeText={(time) => onChange({ ...draft, time })}
          error={!parseIstDateTime(draft.time) ? 'Enter a valid IST date and time.' : undefined}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button
            label="Choose date"
            variant="secondary"
            disabled={disabled}
            onPress={() => openIstPicker('date', draft.time, (time) => onChange({ ...draft, time }))}
          />
          <Button
            label="Choose time"
            variant="secondary"
            disabled={disabled}
            onPress={() => openIstPicker('time', draft.time, (time) => onChange({ ...draft, time }))}
          />
        </View>
        <TextField
          label="Reference"
          value={draft.reference}
          editable={!disabled}
          onChangeText={(reference) => onChange({ ...draft, reference })}
        />
        <TextField
          label="Remarks"
          value={draft.remarks}
          editable={!disabled}
          onChangeText={(remarks) => onChange({ ...draft, remarks })}
          multiline
        />
        <TextField
          label="Location"
          value={draft.locationRaw}
          editable={!disabled}
          onChangeText={(locationRaw) => onChange({ ...draft, locationRaw })}
        />
      </Panel>
      <TransactionPickers
        picker={picker}
        draft={draft}
        onChange={onChange}
        onClose={() => setPicker(null)}
        categories={categories}
        accounts={accounts}
      />
    </>
  );
}
