import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { Text } from 'react-native';
import { emptyRecipientBounds, parseRecipientBounds, type RecipientBounds } from '../../lib/recipient-filters';
import { Sheet } from '../sheet';
import { SheetTextField } from './sheet-text-field';
import { Button, type } from '../ui';

export function RecipientFilterSheet({ value, onApply, onClose }: {
  value: RecipientBounds; onApply: (value: RecipientBounds) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const parsed = parseRecipientBounds(draft);
  return <Sheet open title="Recipient filters" onClose={onClose}>
    <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
      {([
        ['minTransactionCount', 'Minimum count'], ['maxTransactionCount', 'Maximum count'],
        ['minTotalAmount', 'Minimum total (₹)'], ['maxTotalAmount', 'Maximum total (₹)'],
      ] as const).map(([key, label]) => <SheetTextField key={key} label={label} value={draft[key]}
        keyboardType={key.includes('Count') ? 'number-pad' : 'decimal-pad'}
        onChangeText={value => setDraft({ ...draft, [key]: value })} />)}
      {parsed.error ? <Text accessibilityRole="alert" style={type.error}>{parsed.error}</Text> : null}
      <Button label="Clear" variant="secondary" onPress={() => setDraft({ ...emptyRecipientBounds })} />
      <Button label="Apply" disabled={Boolean(parsed.error)} onPress={() => { onApply(draft); onClose(); }} />
    </BottomSheetScrollView>
  </Sheet>;
}
