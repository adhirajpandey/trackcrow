import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Banknote, CreditCard, Landmark, Receipt, Smartphone } from 'lucide-react-native';
import type { Transaction } from '../../lib/api/transactions';
import { formatCurrency, formatTransactionTime } from '../../lib/format';
import { colors, minTarget } from '../../theme';
import { Button, Chip, Panel, type } from '../ui';
const icons = { UPI: Smartphone, CARD: CreditCard, CASH: Banknote, NETBANKING: Landmark, OTHER: Receipt };
export const LedgerRow = memo(function LedgerRow({
  transaction: txn,
  onClassify,
  onIgnore,
  disabled,
}: {
  transaction: Transaction;
  onClassify: (txn: Transaction) => void;
  onIgnore: (txn: Transaction) => void;
  disabled: boolean;
}) {
  const Icon = icons[txn.type];
  const label = `${txn.recipientDisplayName}, ${txn.amount} rupees, ${txn.category ?? 'Needs classification'}, ${txn.type}, ${txn.accountName ?? 'No account'}, ${formatTransactionTime(txn.timestamp)}`;
  return (
    <Panel
      tone={txn.categoryUuid ? 'paper' : 'review'}
      style={{ marginHorizontal: 16, marginBottom: 8, padding: 12, gap: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } })}
          style={{ flex: 1, minWidth: 100, minHeight: minTarget, justifyContent: 'center' }}
        >
          <Text style={type.heading}>{txn.recipientDisplayName}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Classify ${txn.recipientDisplayName}: ${txn.category ?? 'Needs classification'}`}
          disabled={disabled}
          accessibilityState={{ disabled }}
          onPress={() => onClassify(txn)}
          style={{ minHeight: minTarget, justifyContent: 'center' }}
        >
          <Chip
            label={txn.category ?? 'Needs classification'}
            tone={txn.categoryUuid ? 'mint' : 'uncategorized'}
          />
        </Pressable>
        <Text style={[type.number, { fontSize: 20, marginLeft: 'auto' }]}>{formatCurrency(txn.amount)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${txn.recipientDisplayName}`}
        onPress={() => router.push({ pathname: '/transactions/[id]', params: { id: txn.uuid } })}
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: minTarget }}
      >
        <Icon size={16} color={colors.foreground} />
        <Text style={type.muted}>
          {txn.type}
          {txn.accountName ? ` / ${txn.accountName}` : ''} · {formatTransactionTime(txn.timestamp)}
        </Text>
        {txn.subcategory ? <Text style={type.muted}>· {txn.subcategory}</Text> : null}
      </Pressable>
      {!txn.categoryUuid ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button label="Classify now" disabled={disabled} onPress={() => onClassify(txn)} />
          <Button label="Ignore" variant="secondary" disabled={disabled} onPress={() => onIgnore(txn)} />
        </View>
      ) : null}
    </Panel>
  );
});
