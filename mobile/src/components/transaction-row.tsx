import { Banknote, CreditCard, Landmark, Receipt, Smartphone, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Transaction, TransactionType } from '../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../lib/format';
import { colors, fonts, radii } from '../theme';
import { Chip, type } from './ui';
const typeIcons: Record<TransactionType, LucideIcon> = {
  UPI: Smartphone,
  CARD: CreditCard,
  CASH: Banknote,
  NETBANKING: Landmark,
  OTHER: Receipt,
};

const typeLabels: Record<TransactionType, string> = {
  UPI: 'UPI',
  CARD: 'Card',
  CASH: 'Cash',
  NETBANKING: 'Net banking',
  OTHER: 'Other',
};

export function TransactionRow({
  transaction,
  divider = false,
  onPress,
}: {
  transaction: Transaction;
  divider?: boolean;
  onPress?: () => void;
}) {
  const Icon = typeIcons[transaction.type] ?? Receipt;
  const announcement = `${transaction.recipientDisplayName}, ${transaction.amount} rupees, ${transaction.category ?? 'Uncategorized'}, ${typeLabels[transaction.type]}, ${transaction.accountName ?? 'No account'}, ${formatTransactionTime(transaction.timestamp)}`;
  return (
    <Pressable
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={announcement}
      onPress={onPress}
      style={[styles.transaction, divider && styles.transactionDivider]}
    >
      <View style={styles.typeIcon}>
        <Icon size={18} color={colors.foreground} />
      </View>
      <View style={styles.flex}>
        <View style={styles.row}>
          <Text style={[styles.recipient, styles.shrink]}>{transaction.recipientDisplayName}</Text>
          <Chip label={typeLabels[transaction.type] ?? transaction.type} />
        </View>
        <View style={[styles.row, styles.meta]}>
          <Text style={[type.muted, styles.tabular]}>{formatTransactionTime(transaction.timestamp)}</Text>
          {transaction.category ? (
            <Text style={[type.muted, styles.shrink]}>· {transaction.category}</Text>
          ) : (
            <Chip label="Uncategorized" tone="uncategorized" />
          )}
        </View>
      </View>
      <View style={styles.amountColumn}>
        <Text style={[type.number, styles.amount]}>{formatCurrency(transaction.amount)}</Text>
        {transaction.accountName ? <Text style={[type.muted, styles.account]}>{transaction.accountName}</Text> : null}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  transaction: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 72 },
  transactionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  typeIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.muted,
  },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  shrink: { flexShrink: 1 },
  recipient: { fontFamily: fonts.semibold, fontSize: 16, color: colors.foreground },
  meta: { marginTop: 3 },
  tabular: { fontVariant: ['tabular-nums'] },
  amountColumn: { alignItems: 'flex-end', maxWidth: '34%' },
  amount: { fontSize: 16 },
  account: { fontSize: 12, marginTop: 3 },
});
