import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { NameSheet } from '../components/categories/name-sheet';
import { ConfirmDialog } from '../components/confirm-dialog';
import { EmptyState } from '../components/empty-state';
import { useToast } from '../components/toast-host';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
} from '../components/transactions/shared';
import { Button, InlineError, Panel, Skeleton, type } from '../components/ui';
import * as api from '../lib/api/categories';
import type { Credentials } from '../lib/api/client';
import { queryKeys } from '../lib/query-keys';
import { colors } from '../theme';

type Editor = { kind: 'category' | 'subcategory'; uuid?: string; name?: string; categoryUuid?: string };
type Removal = { kind: 'category' | 'subcategory' | 'reset'; uuid?: string; name?: string };
export default function CategoriesScreen() {
  return <TransactionSession>{(credentials) => <Categories credentials={credentials} />}</TransactionSession>;
}
function Categories({ credentials: c }: { credentials: Credentials }) {
  const client = useQueryClient();
  const invalidateLedger = useInvalidateLedger(c);
  const toast = useToast();
  const categories = useQuery({
    queryKey: queryKeys.categories(c.apiUrl),
    queryFn: ({ signal }) => api.fetchCategories(c, signal),
  });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [busy, setBusy] = useState(false);
  async function invalidate() {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.categories(c.apiUrl) }),
      invalidateLedger(),
    ]);
  }
  async function save(name: string) {
    if (!editor || busy) return;
    setBusy(true);
    try {
      if (editor.kind === 'category') {
        if (editor.uuid) await api.updateCategory(c, editor.uuid, name);
        else await api.createCategory(c, name);
      } else {
        const input = { name, categoryUuid: editor.categoryUuid! };
        if (editor.uuid) await api.updateSubcategory(c, editor.uuid, input);
        else await api.createSubcategory(c, input);
      }
      await invalidate();
      toast({
        message: editor.uuid
          ? 'Name updated.'
          : `${editor.kind === 'category' ? 'Category' : 'Subcategory'} added.`,
      });
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!removal || busy) return;
    setBusy(true);
    try {
      if (removal.kind === 'reset') await api.resetCategories(c);
      else if (removal.kind === 'category') await api.deleteCategory(c, removal.uuid!);
      else await api.deleteSubcategory(c, removal.uuid!);
      setRemoval(null);
      await invalidate();
      toast({
        message:
          removal.kind === 'reset' ? 'Default categories restored.' : 'Deleted. Affected rules need repair.',
      });
    } catch (caught) {
      setRemoval(null);
      toast({ message: errorMessage(caught) });
    } finally {
      setBusy(false);
    }
  }
  const warning =
    removal?.kind === 'reset'
      ? 'This deletes all your categories and subcategories and restores the defaults. Affected transactions lose their category and subcategory. Affected rules move to "needs repair".'
      : removal?.kind === 'category'
        ? 'This also deletes its subcategories. Affected transactions lose their category and subcategory. Affected rules move to "needs repair".'
        : 'Affected transactions lose this subcategory and keep their category. Affected rules move to "needs repair".';
  return (
    <TransactionPage title="Categories">
      <Text style={type.note}>make room for your spending</Text>
      <Button label="Add category" disabled={busy} onPress={() => setEditor({ kind: 'category' })} />
      {categories.isPending ? (
        <>
          <Skeleton height={160} />
          <Skeleton height={160} />
        </>
      ) : categories.isError ? (
        <InlineError message={errorMessage(categories.error)} onRetry={() => void categories.refetch()} />
      ) : !categories.data.length ? (
        <EmptyState title="No categories" message="Add your own categories or restore the defaults below." />
      ) : (
        categories.data.map((category) => (
          <Panel key={category.uuid} style={{ padding: 14, gap: 12 }}>
            <Text style={type.heading}>{category.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button
                label="Rename category"
                variant="secondary"
                disabled={busy}
                onPress={() => setEditor({ kind: 'category', uuid: category.uuid, name: category.name })}
              />
              <Button
                label="Delete category"
                variant="destructive"
                disabled={busy}
                onPress={() => setRemoval({ kind: 'category', uuid: category.uuid, name: category.name })}
              />
            </View>
            {category.subcategories.map((sub) => (
              <View
                key={sub.uuid}
                style={{ borderTopWidth: 1, borderColor: colors.secondary, paddingTop: 12, gap: 8 }}
              >
                <Text style={type.body}>{sub.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button
                    label="Rename subcategory"
                    variant="secondary"
                    disabled={busy}
                    onPress={() =>
                      setEditor({
                        kind: 'subcategory',
                        uuid: sub.uuid,
                        name: sub.name,
                        categoryUuid: category.uuid,
                      })
                    }
                  />
                  <Button
                    label="Delete subcategory"
                    variant="destructive"
                    disabled={busy}
                    onPress={() => setRemoval({ kind: 'subcategory', uuid: sub.uuid, name: sub.name })}
                  />
                </View>
              </View>
            ))}
            {!category.subcategories.length ? <Text style={type.muted}>No subcategories yet.</Text> : null}
            <Button
              label="Add subcategory"
              variant="secondary"
              disabled={busy}
              onPress={() => setEditor({ kind: 'subcategory', categoryUuid: category.uuid })}
            />
          </Panel>
        ))
      )}
      <Panel tone="blush" style={{ padding: 14, gap: 10 }}>
        <Text style={type.heading}>Reset categories</Text>
        <Text style={type.muted}>Replace your categories with the default list.</Text>
        <Button
          label="Reset defaults"
          variant="destructive"
          disabled={busy || categories.isPending || categories.isError}
          onPress={() => setRemoval({ kind: 'reset' })}
        />
      </Panel>
      {editor ? (
        <NameSheet
          key={`${editor.kind}:${editor.uuid ?? editor.categoryUuid ?? 'new'}`}
          title={`${editor.uuid ? 'Rename' : 'Add'} ${editor.kind}`}
          initialName={editor.name}
          maxLength={100}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(removal)}
        title={removal?.kind === 'reset' ? 'Reset defaults?' : `Delete ${removal?.name ?? ''}?`}
        message={warning}
        destructive
        busy={busy}
        confirmLabel={removal?.kind === 'reset' ? 'Reset defaults' : 'Delete'}
        onConfirm={() => void remove()}
        onClose={() => setRemoval(null)}
      />
    </TransactionPage>
  );
}
