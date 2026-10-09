import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Transaction } from '../../lib/api/transactions';
import { formatCurrency } from '../../lib/format';
import { dayLabel, istDateKey, istDateTime } from '../../lib/transaction-dates';
import { colors } from '../../theme';
import { Chip, Panel, type } from '../ui';

export function RecipientTransactionRow({ transaction: txn }: { transaction: Transaction }) {
  const when = `${dayLabel(istDateKey(txn.timestamp))}, ${istDateTime(txn.timestamp).slice(11)}`;
  const detail = [txn.accountName ?? txn.type, txn.subcategory].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatCurrency(txn.amount)}, ${when}, ${txn.category ?? 'Uncategorized'}`}
      onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } })}
    >
      <Panel style={[styles.row, !txn.categoryUuid && { backgroundColor: colors.uncategorized }]}>
        <View style={styles.text}>
          <Text style={[type.number, styles.amount]}>{formatCurrency(txn.amount)}</Text>
          <Text style={type.muted}>{when}</Text>
          <Text style={type.muted}>{detail}</Text>
        </View>
        <Chip label={txn.category ?? 'Uncategorized'} tone={txn.categoryUuid ? 'mint' : 'uncategorized'} />
        <ChevronRight size={18} color={colors.foreground} />
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  text: { flex: 1, gap: 2 },
  amount: { fontSize: 17 },
});
