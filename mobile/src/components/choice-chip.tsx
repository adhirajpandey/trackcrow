import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, minTarget, radii } from '../theme';

export function ChoiceChip({
  label,
  selected,
  onPress,
  role = 'radio',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'tab';
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'tab' ? { selected } : { checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.selected]}
    >
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    flex: 1,
    minHeight: minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  selected: { borderWidth: 2, backgroundColor: colors.paperMint },
  text: { fontFamily: fonts.semibold, fontSize: 14, color: colors.foreground },
});
