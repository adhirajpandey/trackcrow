import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Category } from '../../lib/api/categories';
import type { ClassificationSource, TransactionFilters } from '../../lib/api/transactions';
import { colors, fonts, minTarget, radii } from '../../theme';
import { SearchField } from '../search-field';
import { Sheet } from '../sheet';
import { Button, type } from '../ui';

/** Category rows shown before "See all" expands the list. */
const COLLAPSED_CATEGORIES = 5;
const sources = [
  ['MANUAL', 'Manual'],
  ['SUGGESTION', 'Suggestion'],
  ['RULE', 'Rule'],
] as const;
const sorts = [
  ['timestamp', 'desc', 'Newest first'],
  ['timestamp', 'asc', 'Oldest first'],
  ['amount', 'desc', 'Largest first'],
  ['amount', 'asc', 'Smallest first'],
] as const;

export function FilterSheet({
  filters,
  categories,
  onApply,
  onClose,
}: {
  filters: TransactionFilters;
  categories: Category[];
  onApply: (draft: TransactionFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  // Apply closes the sheet with its own animation first; the filters apply once it is dismissed.
  // Unmounting a presented sheet leaves it stuck on screen.
  const [open, setOpen] = useState(true);
  const applied = useRef<TransactionFilters | null>(null);
  function toggleCategory(name: string) {
    setDraft((old) => ({
      ...old,
      category: old.category?.includes(name)
        ? old.category.filter((value) => value !== name)
        : [...(old.category ?? []), name],
    }));
  }
  function toggleSource(source: ClassificationSource) {
    setDraft((old) => ({
      ...old,
      classificationSource: old.classificationSource?.includes(source)
        ? old.classificationSource.filter((value) => value !== source)
        : [...(old.classificationSource ?? []), source],
    }));
  }
  const names = ['Uncategorized', ...categories.map((category) => category.name)];
  const needle = search.trim().toLocaleLowerCase();
  const matches = names.filter((name) => name.toLocaleLowerCase().includes(needle));
  // A search shows every match; otherwise the list stays short until "See all".
  const visible = needle || expanded ? matches : matches.slice(0, COLLAPSED_CATEGORIES);
  const selected = draft.category ?? [];
  return (
    <Sheet
      open={open}
      title="Filter transactions"
      onClose={() => (applied.current ? onApply(applied.current) : onClose())}
      footer={
        <>
          <Button
            label="Apply filters"
            onPress={() => {
              applied.current = draft;
              setOpen(false);
            }}
          />
          <Button
            label="Clear all"
            variant="secondary"
            onPress={() =>
              setDraft({
                q: filters.q,
                startDate: filters.startDate,
                endDate: filters.endDate,
                sortBy: 'timestamp',
                sortOrder: 'desc',
              })
            }
          />
        </>
      }
    >
      <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.sectionRow}>
          <Text style={type.label}>Categories</Text>
          {names.length > COLLAPSED_CATEGORIES && !needle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show fewer categories' : 'See all categories'}
              hitSlop={12}
              onPress={() => setExpanded((old) => !old)}
              style={styles.seeAll}
            >
              <Text style={styles.seeAllText}>{expanded ? 'Show less' : 'See all'}</Text>
              {expanded ? (
                <ChevronUp size={16} color={colors.primaryInk} />
              ) : (
                <ChevronDown size={16} color={colors.primaryInk} />
              )}
            </Pressable>
          ) : null}
        </View>
        {selected.length ? (
          <View style={styles.wrap}>
            {selected.map((name) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${name} filter`}
                onPress={() => toggleCategory(name)}
                hitSlop={6}
                style={styles.selectedChip}
              >
                <Box checked />
                <Text style={styles.selectedChipText}>{name}</Text>
                <X size={14} color={colors.foreground} strokeWidth={2.5} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <SearchField
          inSheet
          label="Search categories"
          placeholder="Search categories"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Text style={type.label}>All categories</Text>
        <View style={styles.list}>
          {visible.map((name) => {
            const checked = selected.includes(name);
            return (
              <Pressable
                key={name}
                accessibilityRole="checkbox"
                accessibilityLabel={name}
                accessibilityState={{ checked }}
                onPress={() => toggleCategory(name)}
                style={[
                  styles.option,
                  name === 'Uncategorized' && styles.uncategorized,
                  checked && styles.optionChecked,
                ]}
              >
                <Box checked={checked} />
                <Text style={styles.optionText}>{name}</Text>
              </Pressable>
            );
          })}
          {!visible.length ? <Text style={type.muted}>No categories match “{search.trim()}”.</Text> : null}
        </View>
        <Text style={type.label}>Classification source</Text>
        <View style={styles.row}>
          {sources.map(([source, label]) => {
            const checked = draft.classificationSource?.includes(source) ?? false;
            return (
              <Pressable
                key={source}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked }}
                onPress={() => toggleSource(source)}
                style={[styles.option, styles.cell, checked && styles.optionChecked]}
              >
                <Box checked={checked} />
                <Text style={[styles.optionText, styles.cellText]} numberOfLines={1} adjustsFontSizeToFit>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={type.label}>Sort</Text>
        <View style={[styles.row, styles.wrap]}>
          {sorts.map(([sortBy, sortOrder, label]) => {
            const checked = draft.sortBy === sortBy && draft.sortOrder === sortOrder;
            return (
              <Pressable
                key={label}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked }}
                onPress={() => setDraft((old) => ({ ...old, sortBy, sortOrder }))}
                style={[styles.option, styles.half, checked && styles.optionChecked]}
              >
                <View style={styles.radio}>{checked ? <View style={styles.radioDot} /> : null}</View>
                <Text style={styles.optionText}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {draft.recipientUuid ? (
          <Text style={type.muted}>A recipient filter is active. Clear all removes it.</Text>
        ) : null}
        {draft.subcategory?.length ? (
          <Text style={type.muted}>Subcategory: {draft.subcategory.join(', ')}. Clear all removes it.</Text>
        ) : null}
      </BottomSheetScrollView>
    </Sheet>
  );
}

/** A square checkbox; checked boxes are filled green with an ink check. */
function Box({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked ? <Check size={13} color={colors.foreground} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // Room for the pinned Apply filters and Clear all buttons.
  content: { gap: 10, paddingBottom: 150 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
    textDecorationLine: 'underline',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.paperMint,
  },
  selectedChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  list: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    minHeight: minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  uncategorized: { backgroundColor: colors.uncategorized },
  optionChecked: { backgroundColor: colors.paperMint },
  optionText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.foreground },
  cell: { flex: 1, paddingHorizontal: 8, gap: 6 },
  cellText: { fontSize: 14 },
  half: { flexBasis: '47%', flexGrow: 1 },
  box: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.card,
  },
  boxChecked: { backgroundColor: colors.primary },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
  },
  radioDot: { width: 10, height: 10, borderRadius: radii.pill, backgroundColor: colors.foreground },
});
