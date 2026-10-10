import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, MapPin } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import type { Category } from '../../lib/api/categories';
import type { Account } from '../../lib/api/accounts';
import type { TransactionType } from '../../lib/api/transactions';
import type { TransactionDraft } from '../../lib/transaction-draft';
import { dayLabel, istDateKey, istDateTime, parseIstDateTime } from '../../lib/transaction-dates';
import { CategorySheet } from '../category-sheet';
import { FormField, FormInput, SelectRow } from '../form-controls';
import { SelectSheet } from '../select-sheet';
import { TextEditSheet } from '../text-edit-sheet';
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

type TextField = {
  key: 'reference' | 'remarks' | 'locationRaw';
  label: string;
  placeholder: string;
  multiline?: boolean;
};

const textFields: TextField[] = [
  { key: 'reference', label: 'Reference', placeholder: 'UPI or bank reference' },
  { key: 'remarks', label: 'Remarks', placeholder: 'Add remarks…', multiline: true },
  { key: 'locationRaw', label: 'Location', placeholder: 'Where it happened' },
];

export function TransactionFormFields({
  draft,
  onChange,
  categories,
  accounts,
  recipient,
  categoryRows,
  variant = 'entry',
  classification = true,
  required = false,
  dateLabel = 'Date',
  autoFocusAmount = false,
  disabled = false,
  readOnly = false,
  onOpenLocation,
}: {
  draft: TransactionDraft;
  onChange: (draft: TransactionDraft) => void;
  categories: Category[];
  accounts: Account[];
  recipient: ReactNode;
  categoryRows?: ReactNode;
  variant?: 'entry' | 'detail';
  classification?: boolean;
  required?: boolean;
  dateLabel?: string;
  autoFocusAmount?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** When set, the read-only location row opens Maps instead of doing nothing. */
  onOpenLocation?: () => void;
}) {
  const [picker, setPicker] = useState<TransactionPicker | null>(null);
  const [editing, setEditing] = useState<TextField | null>(null);
  const detail = variant === 'detail';
  const category = categories.find((item) => item.uuid === draft.categoryUuid);
  const subcategory = category?.subcategories.find((item) => item.uuid === draft.subcategoryUuid);
  const account = accounts.find((item) => item.uuid === draft.accountUuid);
  const dateKey = draft.time.slice(0, 10);
  const dateText = parseIstDateTime(draft.time)
    ? `${dateKey === istDateKey(new Date()) ? 'Today, ' : ''}${dayLabel(dateKey)} · ${draft.time.slice(11)}`
    : undefined;
  return (
    <>
      <FormField label="Amount" required={required} error={amountError(draft.amount)}>
        <FormInput
          prefix="₹"
          segmented={detail}
          accessibilityLabel="Amount in rupees"
          placeholder="0"
          keyboardType="decimal-pad"
          autoFocus={autoFocusAmount}
          editable={!disabled && !readOnly}
          value={draft.amount}
          onChangeText={(amount) => onChange({ ...draft, amount })}
        />
      </FormField>
      <FormField label={dateLabel} required={required}>
        <SelectRow
          label="Date and time"
          icon={Calendar}
          segmented={detail}
          chevron={detail ? 'right' : 'down'}
          value={dateText}
          placeholder="Choose a date"
          disabled={disabled}
          readOnly={readOnly}
          onPress={() =>
            openIstPicker('date', draft.time, (time) => {
              onChange({ ...draft, time });
              openIstPicker('time', time, (next) => onChange({ ...draft, time: next }));
            })
          }
        />
      </FormField>
      <FormField label="Recipient / Merchant" required={required}>
        {recipient}
      </FormField>
      {categoryRows ??
        (classification ? (
          <>
            <FormField label="Category" optional>
              <SelectRow
                label="Category"
                value={category?.name}
                placeholder="Select category"
                chosen={Boolean(category)}
                disabled={disabled}
                readOnly={readOnly}
                onPress={() => setPicker('category')}
                onClear={() => onChange({ ...draft, categoryUuid: null, subcategoryUuid: null })}
              />
            </FormField>
            <FormField label="Subcategory" optional>
              <SelectRow
                label="Subcategory"
                value={subcategory?.name}
                placeholder="Select subcategory"
                chosen={Boolean(subcategory)}
                disabled={disabled || !category}
                readOnly={readOnly}
                onPress={() => setPicker('subcategory')}
              />
            </FormField>
          </>
        ) : null)}
      <FormField label="Payment Method">
        <SelectRow
          label="Payment method"
          value={draft.type}
          placeholder="Select payment method"
          disabled={disabled}
          readOnly={readOnly}
          onPress={() => setPicker('type')}
        />
      </FormField>
      <FormField label="Account" optional>
        <SelectRow
          label="Account"
          value={account?.name}
          placeholder="Select account"
          disabled={disabled}
          readOnly={readOnly}
          onPress={() => setPicker('account')}
        />
      </FormField>
      {textFields.map((field) => (
        <FormField key={field.key} label={field.label} optional>
          {detail && readOnly && field.key === 'locationRaw' && onOpenLocation ? (
            <SelectRow
              label="Open location in Maps"
              value={draft.locationRaw}
              placeholder="—"
              disabled={disabled}
              trailing={MapPin}
              onPress={onOpenLocation}
            />
          ) : detail ? (
            <SelectRow
              label={field.label}
              value={draft[field.key] || undefined}
              placeholder="—"
              disabled={disabled}
              readOnly={readOnly}
              onPress={() => setEditing(field)}
            />
          ) : (
            <FormInput
              accessibilityLabel={field.label}
              placeholder={field.placeholder}
              multiline={field.multiline}
              editable={!disabled && !readOnly}
              value={draft[field.key]}
              onChangeText={(value) => onChange({ ...draft, [field.key]: value })}
            />
          )}
        </FormField>
      ))}
      <TextEditSheet
        open={Boolean(editing)}
        title={editing?.label ?? ''}
        value={editing ? draft[editing.key] : ''}
        placeholder={editing?.placeholder}
        multiline={editing?.multiline}
        onDone={(value) => {
          if (editing) onChange({ ...draft, [editing.key]: value });
        }}
        onClose={() => setEditing(null)}
      />
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
