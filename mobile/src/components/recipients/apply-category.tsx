import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { ApiError, type Credentials } from '../../lib/api/client';
import { categorizeTransaction, fetchTransaction, fetchTransactions } from '../../lib/api/transactions';
import type { RecipientDetail } from '../../lib/api/recipients';
import { errorMessage } from '../transactions/shared';
import { useToast } from '../toast-host';
import { Button, Panel, type } from '../ui';
import { colors } from '../../theme';
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
  return <Panel tone="review" style={{ padding: 16, gap: 12 }}>
    <Text style={type.body}>Most often filed as {category.name}. Apply this category to existing uncategorized entries.</Text>
    <Button label={apply.isPending ? 'Applying…' : `Apply ${category.name} to ${recipient.stats.uncategorizedCount} uncategorized`}
      disabled={apply.isPending || !recipient.stats.uncategorizedCount} onPress={() => apply.mutate()} />
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
