import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CircleX, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, minTarget, radii } from '../theme';

/** A search input with a leading icon and a clear button once it has text. */
export function SearchField({
  label,
  value,
  onChangeText,
  inSheet = false,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  /** Inside a bottom sheet, use its input so the sheet moves with the keyboard. */
  inSheet?: boolean;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  return (
    <View style={styles.field}>
      <Search size={18} color={colors.secondaryForeground} strokeWidth={2.25} />
      <Input
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        {...props}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label.toLocaleLowerCase()}`}
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <CircleX size={20} color={colors.foreground} fill={colors.foreground} stroke={colors.card} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: minTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  input: { flex: 1, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 15, color: colors.foreground },
});
