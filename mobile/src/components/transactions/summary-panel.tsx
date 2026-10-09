import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import type { TransactionDetail } from '../../lib/api/transactions';
import { formatCurrency } from '../../lib/format';
import { dayLabel, istDateKey, istDateTime } from '../../lib/transaction-dates';
import { Chip, Panel, type } from '../ui';

export function SummaryPanel({ transaction: txn }: { transaction: TransactionDetail }) {
  return (
    <Panel tone="mint" style={{ padding: 16, gap: 8 }}>
      <Text style={[type.number, { fontSize: 40 }]}>{formatCurrency(txn.amount)}</Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${txn.recipientDisplayName}, open recipient`}
        hitSlop={8}
        onPress={() => router.push({ pathname: '/recipients/[id]', params: { id: txn.recipientUuid } })}
      >
        <Text style={type.heading}>{txn.recipientDisplayName}</Text>
      </Pressable>
      <Text style={type.body}>
        {txn.type} · {dayLabel(istDateKey(txn.timestamp))}, {istDateTime(txn.timestamp).slice(11)} ·{' '}
        {txn.accountName ?? 'No account'}
      </Text>
      <Chip label={`Source: ${txn.source}`} />
      <Text style={type.muted}>Recipient identifier: {txn.recipientRaw}</Text>
    </Panel>
  );
}
