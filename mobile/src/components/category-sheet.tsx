import { ScrollView, Text, View } from 'react-native';
import type { Category } from '../lib/api/categories';
import { SelectSheet } from './select-sheet';
import { Button, type } from './ui';
export function CategorySheet({
  open,
  categories,
  recentCategoryUuids = [],
  selected,
  onSelect,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  recentCategoryUuids?: string[];
  selected?: string | null;
  onSelect: (categoryUuid: string) => void;
  onClose: () => void;
}) {
  const recent = [...new Set(recentCategoryUuids)]
    .map((id) => categories.find((category) => category.uuid === id))
    .filter((category): category is Category => Boolean(category));
  return (
    <SelectSheet
      open={open}
      title="Category"
      options={categories.map((category) => ({ value: category.uuid, label: category.name }))}
      selected={selected}
      onSelect={onSelect}
      onClose={onClose}
      beforeOptions={
        <View style={{ gap: 8 }}>
          {recent.length ? (
            <>
              <Text style={type.label}>Recent</Text>
              <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
                {recent.map((category) => (
                  <Button
                    key={category.uuid}
                    label={category.name}
                    variant="secondary"
                    onPress={() => {
                      onSelect(category.uuid);
                      onClose();
                    }}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}
          <Text style={type.label}>All categories</Text>
        </View>
      }
    />
  );
}
