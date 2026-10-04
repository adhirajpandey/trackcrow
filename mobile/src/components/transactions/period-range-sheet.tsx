import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { dateRange } from '../../lib/transaction-dates';
import { Sheet } from '../sheet';
import { TextField } from '../text-field';
import { Button, type } from '../ui';
export function PeriodRangeSheet({
  startDate,
  endDate,
  onApply,
  onClose,
}: {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(startDate),
    [end, setEnd] = useState(endDate);
  const [open, setOpen] = useState(true);
  const chosen = useRef<[string, string] | null>(null);
  const valid = dateRange(start, end);
  function choose(range: [string, string]) {
    chosen.current = range;
    setOpen(false);
  }
  return (
    <Sheet
      open={open}
      title="Custom period"
      onClose={() => (chosen.current ? onApply(...chosen.current) : onClose())}
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        <TextField
          label="Start date (IST)"
          hint="YYYY-MM-DD"
          value={start}
          onChangeText={setStart}
          autoCapitalize="none"
        />
        <TextField
          label="End date (IST)"
          hint="YYYY-MM-DD"
          value={end}
          onChangeText={setEnd}
          autoCapitalize="none"
        />
        {!valid ? <Text style={type.error}>Enter valid dates with the start before the end.</Text> : null}
        <Button label="Apply period" disabled={!valid} onPress={() => choose([start, end])} />
        <Button label="All time" variant="secondary" onPress={() => choose(['', ''])} />
      </BottomSheetScrollView>
    </Sheet>
  );
}
