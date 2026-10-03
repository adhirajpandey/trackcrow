import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChevronRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { Category } from '../lib/api/categories';
import { colors, fonts, minTarget, radii } from '../theme';
import { EmptyState } from './empty-state';
import { SearchField } from './search-field';
import { Sheet } from './sheet';
import { Button, Radio, type } from './ui';

type Selection = { categoryUuid: string; subcategoryUuid: string | null };

export function CategorySheet({
  open,
  categories,
  recentCategoryUuids = [],
  selected,
  selectedSubcategory,
  onSelect,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  recentCategoryUuids?: string[];
  selected?: string | null;
  selectedSubcategory?: string | null;
  onSelect: (categoryUuid: string, subcategoryUuid: string | null) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const chosen = useRef<Selection | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setClosing(false);
      setStep(null);
      setSearch('');
    }
  }
  const recent = [...new Set(recentCategoryUuids)]
    .map((id) => categories.find((category) => category.uuid === id))
    .filter((category): category is Category => Boolean(category));
  function finish(selection: Selection) {
    chosen.current = selection;
    setClosing(true);
  }
  function openCategory(category: Category) {
    if (!category.subcategories.length) {
      finish({ categoryUuid: category.uuid, subcategoryUuid: null });
      return;
    }
    setStep(category);
    setSearch('');
    setSubcategory(category.uuid === selected ? (selectedSubcategory ?? null) : null);
  }
  const needle = search.trim().toLocaleLowerCase();
  const matches = <T extends { name: string }>(items: T[]) =>
    items.filter((item) => item.name.toLocaleLowerCase().includes(needle));
  const visibleSubcategories = step ? matches([{ uuid: '', name: 'No subcategory' }, ...step.subcategories]) : [];
  const visibleCategories = matches(categories);
  return (
    <Sheet
      open={open && !closing}
      title={step ? step.name : 'Select category'}
      onBack={
        step
          ? () => {
              setStep(null);
              setSearch('');
            }
          : undefined
      }
      onClose={() => {
        const selection = chosen.current;
        chosen.current = null;
        if (selection) onSelect(selection.categoryUuid, selection.subcategoryUuid);
        onClose();
      }}
      footer={
        step ? (
          <Button
            label="Select subcategory"
            onPress={() => finish({ categoryUuid: step.uuid, subcategoryUuid: subcategory || null })}
          />
        ) : undefined
      }
    >
      {step ? <Text style={styles.subtitle}>Select subcategory</Text> : null}
      <SearchField
        inSheet
        key={step ? 'subcategories' : 'categories'}
        label={step ? 'Search subcategories' : 'Search categories'}
        placeholder={step ? 'Search subcategories' : 'Search categories'}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={[styles.content, step && styles.withFooter]}
      >
        {!step && !needle && recent.length ? (
          <>
            <Text style={type.label}>Recent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recent}>
              {recent.map((category) => (
                <Button
                  key={category.uuid}
                  label={category.name}
                  variant="secondary"
                  onPress={() => openCategory(category)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
        <Text style={type.label}>
          {needle ? 'Search results' : step ? 'Subcategories' : 'All categories'}
        </Text>
        {step && !visibleSubcategories.length ? (
          <EmptyState title="No matches" message="Try a different search." />
        ) : step ? (
          visibleSubcategories.map((item) => {
            const checked = (subcategory ?? '') === item.uuid;
            return (
              <Pressable
                key={item.uuid || 'none'}
                accessibilityRole="radio"
                accessibilityLabel={item.name}
                accessibilityState={{ checked }}
                onPress={() => setSubcategory(item.uuid || null)}
                style={[styles.row, checked && styles.selected]}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                <Radio checked={checked} />
              </Pressable>
            );
          })
        ) : visibleCategories.length ? (
          visibleCategories.map((category) => (
            <Pressable
              key={category.uuid}
              accessibilityRole="button"
              accessibilityLabel={
                category.subcategories.length ? `${category.name}, choose a subcategory` : category.name
              }
              accessibilityState={{ selected: category.uuid === selected }}
              onPress={() => openCategory(category)}
              style={[styles.row, category.uuid === selected && styles.selected]}
            >
              <Text style={styles.rowText}>{category.name}</Text>
              <ChevronRight size={18} color={colors.foreground} />
            </Pressable>
          ))
        ) : (
          <EmptyState title="No matches" message="Try a different search." />
        )}
      </BottomSheetScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground, marginTop: -4 },
  scroll: { flex: 1 },
  content: { gap: 6, paddingBottom: 16 },
  withFooter: { paddingBottom: 96 },
  recent: { gap: 8, paddingBottom: 6 },
  row: {
    minHeight: minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.paperMint },
  rowText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.foreground },
});
