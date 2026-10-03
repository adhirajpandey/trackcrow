import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banknote, CreditCard, Landmark, Receipt, Smartphone } from 'lucide-react-native';
import type { Transaction } from '../../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../../lib/format';
import { colors, fonts } from '../../theme';
import { Button, Chip, Panel, type } from '../ui';
const icons = { UPI: Smartphone, CARD: CreditCard, CASH: Banknote, NETBANKING: Landmark, OTHER: Receipt };
export const LedgerRow = memo(function LedgerRow({
  transaction: txn,
  onClassify,
  onIgnore,
  disabled,
  showActions = true,
}: {
  transaction: Transaction;
  onClassify: (txn: Transaction) => void;
  onIgnore: (txn: Transaction) => void;
  disabled: boolean;
  /** Transactions keeps rows compact; uncategorized entries are classified from their chip there. */
  showActions?: boolean;
}) {
  const Icon = icons[txn.type];
  const label = `${txn.recipientDisplayName}, ${txn.amount} rupees, ${txn.category ?? 'Needs classification'}, ${txn.type}, ${txn.accountName ?? 'No account'}, ${formatTransactionTime(txn.timestamp)}`;
  const open = () => router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } });
  return (
    <Panel
      style={[styles.row, !txn.categoryUuid && { backgroundColor: colors.uncategorized }]}
    >
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={open} hitSlop={8} style={styles.name}>
          <Text style={styles.recipient} numberOfLines={1}>
            {txn.recipientDisplayName}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Classify ${txn.recipientDisplayName}: ${txn.category ?? 'Needs classification'}`}
          disabled={disabled}
          accessibilityState={{ disabled }}
          onPress={() => onClassify(txn)}
          hitSlop={10}
        >
          <Chip
            label={txn.category ?? 'Uncategorized'}
            tone={txn.categoryUuid ? 'mint' : 'uncategorized'}
          />
        </Pressable>
        <Text style={[type.number, styles.amount]}>{formatCurrency(txn.amount)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${txn.recipientDisplayName}`}
        onPress={open}
        hitSlop={8}
        style={styles.meta}
      >
        <Icon size={14} color={colors.secondaryForeground} style={styles.icon} />
        <Text style={[type.muted, styles.flex]}>
          {txn.type}
          {txn.accountName ? ` / ${txn.accountName}` : ''} · {formatTransactionTime(txn.timestamp)}
          {txn.subcategory ? ` · ${txn.subcategory}` : ''}
        </Text>
      </Pressable>
      {showActions && !txn.categoryUuid ? (
        <View style={styles.actions}>
          <Button label="Classify now" disabled={disabled} onPress={() => onClassify(txn)} />
          <Button label="Ignore" variant="secondary" disabled={disabled} onPress={() => onIgnore(txn)} />
        </View>
      ) : null}
    </Panel>
  );
});
const styles = StyleSheet.create({
  row: { marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1 },
  recipient: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.foreground },
  amount: { fontSize: 17, marginLeft: 'auto' },
  meta: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  icon: { marginTop: 3 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
