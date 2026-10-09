import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { ApiError, type Credentials } from '../../lib/api/client';
import { categorizeTransaction, fetchTransaction, fetchTransactions } from '../../lib/api/transactions';
import type { RecipientDetail } from '../../lib/api/recipients';
import { errorMessage } from '../transactions/shared';
import { useToast } from '../toast-host';
import { WandSparkles } from 'lucide-react-native';
import { Button, Chip, Panel, type } from '../ui';
import { colors, fonts, radii } from '../../theme';
import { canApplyRecipientCategory } from '../../lib/recipient-category';
import { useInvalidateRecipientsAndRules } from './shared';

export function ApplyRecipientCategory({ credentials: c, recipient }: {
  credentials: Credentials; recipient: RecipientDetail;
}) {
  const [progress, setProgress] = useState('');
  const toast = useToast();
  const invalidate = useInvalidateRecipientsAndRules(c.apiUrl);
  const category = recipient.dominantCategory;
  const apply = useMutation({
    mutationFn: async () => {
      if (!category) return;
      const ids = new Set<string>();
      setProgress('Finding uncategorized transactions…');
      // Snapshot every page before PATCH changes the filtered result set.
      for (let page = 1; ; page++) {
        const result = await fetchTransactions(c, {
          recipientUuid: recipient.uuid, category: ['Uncategorized'], page, size: 100,
        });
        result.transactions.forEach(row => ids.add(row.uuid));
        if (!result.hasNext) break;
      }
      let filed = 0;
      let checked = 0;
      try {
        for (const id of ids) {
          try {
            const row = await fetchTransaction(c, id);
            if (canApplyRecipientCategory(row, recipient.uuid)) {
              await categorizeTransaction(c, id, { categoryUuid: category.uuid, subcategoryUuid: null });
              filed++;
            }
          } catch (error) {
            if (!(error instanceof ApiError && error.status === 404)) throw error;
          }
          checked++;
          setProgress(`${filed} filed · ${ids.size - checked} left`);
        }
        toast({ message: `Filed ${filed} transactions as ${category.name}.` });
      } catch (error) {
        toast({ message: `${filed} filed. Some remain; retry to continue.` });
        throw error;
      }
    },
    onSettled: () => invalidate(),
  });
  if (!category || (!recipient.stats.uncategorizedCount && !apply.isError)) return null;
  const count = recipient.stats.uncategorizedCount;
  return <Panel style={{ padding: 14, gap: 10, backgroundColor: colors.uncategorized }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
        borderColor: colors.border, borderRadius: radii.pill, backgroundColor: colors.accent }}>
        <WandSparkles size={20} color={colors.foreground} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.foreground }}>
          {count} uncategorized {count === 1 ? 'transaction' : 'transactions'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={type.muted}>Usually filed as</Text>
          <Chip label={category.name} tone="mint" />
        </View>
      </View>
      <Button label={apply.isPending ? 'Applying…' : 'Apply'} compact
        disabled={apply.isPending || !count} onPress={() => apply.mutate()} />
    </View>
    {apply.isError ? <Text accessibilityRole="alert" style={type.error}>{errorMessage(apply.error)}</Text> : null}
    <Modal visible={apply.isPending} transparent onRequestClose={() => undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: `${colors.foreground}80` }}>
        <Panel raised tone="mint" style={{ padding: 20, gap: 12 }}>
          <Text style={type.heading}>Applying {category.name}</Text>
          <Text accessibilityLiveRegion="polite" style={type.body}>{progress}</Text>
        </Panel>
      </View>
    </Modal>
  </Panel>;
}
