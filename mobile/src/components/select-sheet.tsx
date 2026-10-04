import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, minTarget, radii } from '../theme';
import { EmptyState } from './empty-state';
import { Sheet } from './sheet';
import { type } from './ui';
export type SelectOption = { value: string; label: string; description?: string };
export type SelectSheetProps = {
  open: boolean;
  title: string;
  options: SelectOption[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  beforeOptions?: ReactNode;
  searchable?: boolean;
};
export function SelectSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
  beforeOptions,
  searchable = true,
}: SelectSheetProps) {
  const [search, setSearch] = useState('');
  const visible = options.filter((option) =>
    `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  function close() {
    setSearch('');
    onClose();
  }
  function select(value: string) {
    onSelect(value);
    close();
  }
  return (
    <Sheet open={open} title={title} onClose={close}>
      {searchable ? (
        <BottomSheetTextInput
          accessibilityLabel={`Search ${title}`}
          placeholder="Search"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
      ) : null}
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.options}>
        {!search.trim() ? beforeOptions : null}
        {visible.length ? (
          visible.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === option.value }}
              onPress={() => select(option.value)}
              style={[styles.option, selected === option.value && styles.selected]}
            >
              <View style={styles.label}>
                <Text style={type.body}>{option.label}</Text>
                {option.description ? <Text style={type.muted}>{option.description}</Text> : null}
              </View>
              {selected === option.value ? <Text style={type.body}>✓</Text> : null}
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
  search: {
    minHeight: minTarget + 4,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.card,
  },
  options: { gap: 6, paddingBottom: 16 },
  option: {
    minHeight: minTarget,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  selected: { backgroundColor: colors.paperMint },
  label: { flex: 1 },
});
