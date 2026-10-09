import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NameSheet } from '../components/categories/name-sheet';
import { ConfirmDialog } from '../components/confirm-dialog';
import { EmptyState } from '../components/empty-state';
import { SelectSheet } from '../components/select-sheet';
import { useToast } from '../components/toast-host';
import {
  TransactionPage,
  TransactionSession,
  errorMessage,
  useInvalidateLedger,
} from '../components/transactions/shared';
import { Button, HeaderIconButton, InlineError, Panel, Skeleton, type } from '../components/ui';
import * as api from '../lib/api/categories';
import type { Credentials } from '../lib/api/client';
import { queryKeys } from '../lib/query-keys';
import { colors, fonts, radii } from '../theme';

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
  const [menu, setMenu] = useState<Editor & { kind: 'category' | 'subcategory' } | null>(null);
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
    <TransactionPage title="Categories" heading="Categories">
      <Text style={type.muted}>Group your spending. Subcategories add detail within a category.</Text>
      <Button label="Add category" icon={Plus} disabled={busy} onPress={() => setEditor({ kind: 'category' })} />
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
          <Panel key={category.uuid} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.flex}>
                <Text style={styles.name}>{category.name}</Text>
                <Text style={type.muted}>
                  {category.subcategories.length
                    ? `${category.subcategories.length} ${category.subcategories.length === 1 ? 'subcategory' : 'subcategories'}`
                    : 'No subcategories yet'}
                </Text>
              </View>
              <HeaderIconButton
                icon={EllipsisVertical}
                label={`Actions for ${category.name}`}
                disabled={busy}
                onPress={() => setMenu({ kind: 'category', uuid: category.uuid, name: category.name })}
              />
            </View>
            {category.subcategories.map((sub) => (
              <View key={sub.uuid} style={styles.sub}>
                <Text style={[type.body, styles.flex]}>{sub.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Actions for ${sub.name}`}
                  hitSlop={10}
                  disabled={busy}
                  onPress={() =>
                    setMenu({ kind: 'subcategory', uuid: sub.uuid, name: sub.name, categoryUuid: category.uuid })
                  }
                >
                  <EllipsisVertical size={18} color={colors.foreground} />
                </Pressable>
              </View>
            ))}
            <Button
              label="Add subcategory"
              icon={Plus}
              variant="secondary"
              compact
              disabled={busy}
              onPress={() => setEditor({ kind: 'subcategory', categoryUuid: category.uuid })}
            />
          </Panel>
        ))
      )}
      <Panel tone="blush" style={styles.danger}>
        <Text style={type.heading}>Danger zone</Text>
        <Text style={type.muted}>Replace your categories with the default list.</Text>
        <Button
          label="Reset defaults"
          variant="destructive"
          disabled={busy || categories.isPending || categories.isError}
          onPress={() => setRemoval({ kind: 'reset' })}
        />
      </Panel>
      <SelectSheet
        open={Boolean(menu)}
        title={menu?.name ?? ''}
        searchable={false}
        chevrons
        options={[
          { value: 'rename', label: `Rename ${menu?.kind ?? ''}`, description: 'Change its name everywhere', icon: Pencil },
          {
            value: 'delete',
            label: `Delete ${menu?.kind ?? ''}`,
            description:
              menu?.kind === 'category'
                ? 'Also deletes its subcategories'
                : 'Transactions keep their category',
            icon: Trash2,
          },
        ]}
        onClose={() => setMenu(null)}
        onSelect={(action) => {
          if (!menu) return;
          if (action === 'rename') setEditor(menu);
          else setRemoval({ kind: menu.kind, uuid: menu.uuid, name: menu.name });
        }}
      />
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

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  name: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  flex: { flex: 1 },
  sub: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  danger: { padding: 14, gap: 10 },
});
