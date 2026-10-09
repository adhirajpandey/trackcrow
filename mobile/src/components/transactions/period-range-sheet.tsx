import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { dateRange, dayLabel, istDateTime } from '../../lib/transaction-dates';
import { FormField, SelectRow } from '../form-controls';
import { Sheet } from '../sheet';
import { openIstPicker } from './form-fields';
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
  const days = valid ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1 : 0;
  function pick(which: 'start' | 'end') {
    const value = which === 'start' ? start : end;
    openIstPicker('date', `${value || istDateTime(new Date().toISOString()).slice(0, 10)} 00:00`, (time) =>
      (which === 'start' ? setStart : setEnd)(time.slice(0, 10)),
    );
  }
  return (
    <Sheet
      open={open}
      title="Custom period"
      onClose={() => (chosen.current ? onApply(...chosen.current) : onClose())}
      footer={
        <View style={styles.footer}>
          <Button label="All time" variant="secondary" style={styles.flex} onPress={() => choose(['', ''])} />
          <Button label="Apply period" disabled={!valid} style={styles.wide} onPress={() => choose([start, end])} />
        </View>
      }
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <FormField label="From">
          <SelectRow
            label="Start date"
            icon={Calendar}
            chevron="down"
            value={start ? dayLabel(start) : undefined}
            placeholder="Choose a start date"
            onPress={() => pick('start')}
          />
        </FormField>
        <FormField label="To">
          <SelectRow
            label="End date"
            icon={Calendar}
            chevron="down"
            value={end ? dayLabel(end) : undefined}
            placeholder="Choose an end date"
            onPress={() => pick('end')}
          />
        </FormField>
        {valid ? (
          <Text style={type.muted}>
            {days} {days === 1 ? 'day' : 'days'} · dates are in IST
          </Text>
        ) : (
          <Text style={type.error}>Choose a start date on or before the end date.</Text>
        )}
      </BottomSheetScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 120 },
  footer: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  wide: { flex: 2 },
});
