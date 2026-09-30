import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Category } from '../../lib/api/categories';
import type { ClassificationSource, TransactionFilters } from '../../lib/api/transactions';
import { Sheet } from '../sheet';
import { Button, Chip, type } from '../ui';
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
  return (
    <Sheet open title="Filter transactions" onClose={onClose}>
      <BottomSheetScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        <Text style={type.label}>Categories</Text>
        <View style={{ gap: 4 }}>
          {['Uncategorized', ...categories.map((category) => category.name)].map((name) => (
            <Pressable
              key={name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.category?.includes(name) ?? false }}
              onPress={() => toggleCategory(name)}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={type.body}>{draft.category?.includes(name) ? '☑' : '☐'}</Text>
              <Chip label={name} tone={name === 'Uncategorized' ? 'uncategorized' : 'paper'} />
            </Pressable>
          ))}
        </View>
        <Text style={type.label}>Classification source</Text>
        {(['MANUAL', 'SUGGESTION', 'RULE'] as const).map((source) => (
          <Pressable
            key={source}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.classificationSource?.includes(source) ?? false }}
            onPress={() => toggleSource(source)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={type.body}>
              {draft.classificationSource?.includes(source) ? '☑' : '☐'}{' '}
              {source === 'MANUAL' ? 'Manual' : source === 'RULE' ? 'Rule' : 'Suggestion'}
            </Text>
          </Pressable>
        ))}
        <Text style={type.label}>Sort</Text>
        {(
          [
            ['timestamp', 'desc', 'Newest first'],
            ['timestamp', 'asc', 'Oldest first'],
            ['amount', 'desc', 'Largest first'],
            ['amount', 'asc', 'Smallest first'],
          ] as const
        ).map(([sortBy, sortOrder, label]) => (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: draft.sortBy === sortBy && draft.sortOrder === sortOrder }}
            onPress={() => setDraft((old) => ({ ...old, sortBy, sortOrder }))}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={type.body}>
              {draft.sortBy === sortBy && draft.sortOrder === sortOrder ? '●' : '○'} {label}
            </Text>
          </Pressable>
        ))}
        {draft.recipientUuid ? (
          <Text style={type.muted}>A recipient filter is active. Clear removes it.</Text>
        ) : null}
        {draft.subcategory?.length ? (
          <Text style={type.muted}>Subcategory: {draft.subcategory.join(', ')}. Clear removes it.</Text>
        ) : null}
        <Button
          label="Clear"
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
        <Button label="Apply" onPress={() => onApply(draft)} />
      </BottomSheetScrollView>
    </Sheet>
  );
}
