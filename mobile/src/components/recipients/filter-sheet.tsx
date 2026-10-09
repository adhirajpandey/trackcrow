import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecipientFilters } from '../../lib/api/recipients';
import { emptyRecipientBounds, parseRecipientBounds, type RecipientBounds } from '../../lib/recipient-filters';
import { colors, fonts, radii } from '../../theme';
import { ChoiceChip } from '../choice-chip';
import { Sheet } from '../sheet';
import { Button, type } from '../ui';

export type RecipientListOptions = {
  bounds: RecipientBounds;
  sortBy: NonNullable<RecipientFilters['sortBy']>;
  sortOrder: 'asc' | 'desc';
};

export const defaultRecipientOptions: RecipientListOptions = {
  bounds: { ...emptyRecipientBounds },
  sortBy: 'displayName',
  sortOrder: 'asc',
};

const sorts = [
  ['displayName', 'Name'],
  ['transactionCount', 'Count'],
  ['totalAmount', 'Total paid'],
] as const;

const orders = [
  ['asc', 'Ascending'],
  ['desc', 'Descending'],
] as const;

export function RecipientFilterSheet({
  value,
  onApply,
  onClose,
}: {
  value: RecipientListOptions;
  onApply: (value: RecipientListOptions) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  // Apply closes the sheet with its own animation first; the filters apply once it is dismissed.
  // Unmounting a presented sheet leaves it stuck on screen.
  const [open, setOpen] = useState(true);
  const applied = useRef<RecipientListOptions | null>(null);
  const parsed = parseRecipientBounds(draft.bounds);
  const setBound = (key: keyof RecipientBounds, text: string) =>
    setDraft({ ...draft, bounds: { ...draft.bounds, [key]: text } });
  return (
    <Sheet
      open={open}
      title="Recipient filters"
      onClose={() => (applied.current ? onApply(applied.current) : onClose())}
      footer={
        <>
          <Button
            label="Clear all"
            variant="secondary"
            onPress={() => setDraft({ ...defaultRecipientOptions, bounds: { ...emptyRecipientBounds } })}
          />
          <Button
            label="Apply filters"
            disabled={Boolean(parsed.error)}
            onPress={() => {
              applied.current = draft;
              setOpen(false);
            }}
          />
        </>
      }
    >
      <BottomSheetScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={type.label}>Transaction count</Text>
        <View style={styles.row}>
          <BoundField
            label="Minimum"
            placeholder="e.g. 1"
            keyboardType="number-pad"
            value={draft.bounds.minTransactionCount}
            onChangeText={(text) => setBound('minTransactionCount', text)}
          />
          <BoundField
            label="Maximum"
            placeholder="e.g. 10"
            keyboardType="number-pad"
            value={draft.bounds.maxTransactionCount}
            onChangeText={(text) => setBound('maxTransactionCount', text)}
          />
        </View>
        <Text style={type.label}>Total paid (₹)</Text>
        <View style={styles.row}>
          <BoundField
            label="Minimum"
            placeholder="e.g. 100"
            prefix="₹"
            keyboardType="decimal-pad"
            value={draft.bounds.minTotalAmount}
            onChangeText={(text) => setBound('minTotalAmount', text)}
          />
          <BoundField
            label="Maximum"
            placeholder="e.g. 10,000"
            prefix="₹"
            keyboardType="decimal-pad"
            value={draft.bounds.maxTotalAmount}
            onChangeText={(text) => setBound('maxTotalAmount', text)}
          />
        </View>
        {parsed.error ? (
          <Text accessibilityRole="alert" style={type.error}>
            {parsed.error}
          </Text>
        ) : null}
        <Text style={type.label}>Sort by</Text>
        <View style={styles.row}>
          {sorts.map(([sortBy, label]) => (
            <ChoiceChip
              key={sortBy}
              label={label}
              selected={draft.sortBy === sortBy}
              onPress={() => setDraft({ ...draft, sortBy })}
            />
          ))}
        </View>
        <Text style={type.label}>Sort order</Text>
        <View style={styles.row}>
          {orders.map(([sortOrder, label]) => (
            <ChoiceChip
              key={sortOrder}
              label={label}
              selected={draft.sortOrder === sortOrder}
              onPress={() => setDraft({ ...draft, sortOrder })}
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </Sheet>
  );
}

function BoundField({
  label,
  prefix,
  ...props
}: {
  label: string;
  prefix?: string;
  placeholder: string;
  keyboardType: 'number-pad' | 'decimal-pad';
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <BottomSheetTextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.mutedForeground}
          style={styles.input}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // Room for the pinned Clear all and Apply filters buttons.
  content: { gap: 10, paddingBottom: 150 },
  row: { flexDirection: 'row', gap: 8 },
  field: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.secondaryForeground },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  input: { flex: 1, paddingHorizontal: 0, paddingVertical: 4, fontFamily: fonts.regular, fontSize: 15, color: colors.foreground },
});
