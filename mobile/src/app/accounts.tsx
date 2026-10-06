import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { NameSheet } from '../components/categories/name-sheet';
import { EmptyState } from '../components/empty-state';
import { useToast } from '../components/toast-host';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
} from '../components/transactions/shared';
import { Button, InlineError, Panel, Skeleton, type } from '../components/ui';
import { fetchAccounts, createAccount, updateAccount, type Account } from '../lib/api/accounts';
import type { Credentials } from '../lib/api/client';
import { queryKeys } from '../lib/query-keys';
import { colors, fonts } from '../theme';

export default function AccountsScreen() {
  return <TransactionSession>{(credentials) => <Accounts credentials={credentials} />}</TransactionSession>;
}
function Accounts({ credentials: c }: { credentials: Credentials }) {
  const client = useQueryClient();
  const invalidate = useInvalidateLedger(c);
  const toast = useToast();
  const accounts = useQuery({
    queryKey: queryKeys.accounts(c.apiUrl),
    queryFn: ({ signal }) => fetchAccounts(c, signal),
  });
  const [editor, setEditor] = useState<Account | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(name: string) {
    if (!editor || busy) return;
    setBusy(true);
    try {
      if (editor === 'new') await createAccount(c, name);
      else await updateAccount(c, editor.uuid, name);
      await Promise.all([client.invalidateQueries({ queryKey: queryKeys.accounts(c.apiUrl) }), invalidate()]);
      toast({ message: editor === 'new' ? 'Account added.' : 'Account renamed.' });
    } finally {
      setBusy(false);
    }
  }
  return (
    <TransactionPage title="Accounts" heading="Accounts">
      <Text style={type.muted}>Add or rename the accounts you pay from. Accounts can’t be deleted.</Text>
      <Button label="Add account" icon={Plus} disabled={busy} onPress={() => setEditor('new')} />
      {accounts.isPending ? (
        <Skeleton height={160} />
      ) : accounts.isError ? (
        <InlineError message={errorMessage(accounts.error)} onRetry={() => void accounts.refetch()} />
      ) : !accounts.data.length ? (
        <EmptyState title="No accounts" message="Add an account to identify where you paid from." />
      ) : (
        accounts.data.map((account) => (
          <Panel key={account.uuid} style={styles.account}>
            <Text style={styles.name} numberOfLines={1}>
              {account.name}
            </Text>
            <Button
              label="Rename"
              variant="secondary"
              compact
              disabled={busy}
              onPress={() => setEditor(account)}
            />
          </Panel>
        ))
      )}
      {editor ? (
        <NameSheet
          key={editor === 'new' ? 'new' : editor.uuid}
          title={editor === 'new' ? 'Add account' : 'Rename account'}
          initialName={editor === 'new' ? '' : editor.name}
          maxLength={100}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </TransactionPage>
  );
}

const styles = StyleSheet.create({
  account: { paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  name: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
});
