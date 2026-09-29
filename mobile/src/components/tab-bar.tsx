import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, shadows } from '../theme';

type TabButtonProps = TabTriggerSlotProps & { icon: LucideIcon; label: string; a11yLabel: string };

export function TabButton({ icon: Icon, label, a11yLabel, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: isFocused }}
      style={styles.button}
    >
      <View style={[styles.inner, isFocused && styles.focused]}>
        <Icon size={20} color={colors.foreground} strokeWidth={isFocused ? 2.4 : 1.9} />
        <Text style={[styles.label, !isFocused && styles.labelIdle]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export const tabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.shell,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingHorizontal: 6,
    paddingTop: 8,
  },
});

const styles = StyleSheet.create({
  button: { flex: 1, minHeight: 56 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginHorizontal: 2,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focused: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
    boxShadow: shadows.control,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  labelIdle: { fontFamily: fonts.semibold, color: colors.secondaryForeground },
});
