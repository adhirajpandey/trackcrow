import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme';
import { type } from './ui';

/** A bordered row with an optional icon badge, a label and description, and an optional chevron. */
export function MenuRow({
  icon: Icon,
  label,
  description,
  badge = colors.primary,
  tone = colors.card,
  labelColor = colors.foreground,
  trailing,
  onPress,
}: {
  icon?: LucideIcon;
  label: string;
  description?: string;
  badge?: string;
  tone?: string;
  labelColor?: string;
  trailing?: LucideIcon | null;
  onPress?: () => void;
}) {
  const Trailing = trailing === undefined ? (onPress ? ChevronRight : null) : trailing;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: tone }, pressed && styles.pressed]}
    >
      {Icon ? (
        <View style={[styles.badge, { backgroundColor: badge }]}>
          <Icon size={20} color={colors.foreground} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {description ? <Text style={type.muted}>{description}</Text> : null}
      </View>
      {Trailing ? <Trailing size={20} color={colors.foreground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  pressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  badge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bold, fontSize: 16 },
});
