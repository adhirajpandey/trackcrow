import { Check, ChevronLeft, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, minTarget, radii, shadows } from '../theme';

export const type = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.foreground },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.secondaryForeground,
  },
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.foreground },
  number: { fontFamily: fonts.bold, color: colors.foreground, fontVariant: ['tabular-nums'] },
  note: { fontFamily: fonts.hand, fontSize: 17, lineHeight: 22, color: colors.destructiveInk },
  error: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.destructiveInk },
});

export type Tone = 'paper' | 'mint' | 'lilac' | 'blush' | 'review' | 'muted';

const toneBackground: Record<Tone, string> = {
  paper: colors.card,
  mint: colors.paperMint,
  lilac: colors.paperLilac,
  blush: colors.paperBlush,
  review: colors.paperYellow,
  muted: colors.muted,
};

export function Panel({
  tone = 'paper',
  raised = false,
  style,
  children,
}: {
  tone?: Tone;
  /** Emphasised panels get the solid offset shadow; ordinary rows stay flat. */
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[styles.panel, { backgroundColor: toneBackground[tone] }, raised && styles.raised, style]}>
      {children}
    </View>
  );
}

export function Chip({ label, tone = 'paper' }: { label: string; tone?: 'paper' | 'mint' | 'uncategorized' | 'lilac' }) {
  const backgroundColor =
    tone === 'mint' ? colors.paperMint : tone === 'uncategorized' ? colors.uncategorized : tone === 'lilac' ? colors.paperLilac : colors.card;
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

const buttonColors: Record<ButtonVariant, { background: string; text: string; border: string }> = {
  primary: { background: colors.primary, text: colors.primaryForeground, border: colors.border },
  secondary: { background: colors.card, text: colors.foreground, border: colors.border },
  destructive: { background: colors.destructive, text: colors.card, border: colors.border },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  trailingIcon: TrailingIcon,
  disabled = false,
  selected,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** For toggles such as period chips, so the selection is announced as well as shown. */
  selected?: boolean;
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = buttonColors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        !pressed && !disabled && styles.buttonShadow,
        pressed && styles.buttonPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {Icon ? <Icon size={18} color={palette.text} strokeWidth={2.25} /> : null}
      <Text style={[styles.buttonText, { color: palette.text }]}>{label}</Text>
      {TrailingIcon ? <TrailingIcon size={18} color={palette.text} strokeWidth={2.25} /> : null}
    </Pressable>
  );
}

/** A dashed outline for empty states that invite the first action. */
export function DashedPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.dashed, style]}>{children}</View>;
}

export function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel="Back" hitSlop={12} onPress={onPress} style={styles.back}>
      <ChevronLeft size={16} color={colors.primaryInk} strokeWidth={2.5} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  );
}

export function HeaderIconButton({
  icon: Icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.headerIcon, pressed && styles.buttonPressed, disabled && styles.disabled]}
    >
      <Icon size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.mark, styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? <Check size={13} color={colors.foreground} strokeWidth={3} /> : null}
    </View>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return <View style={[styles.mark, styles.radio]}>{checked ? <View style={styles.radioDot} /> : null}</View>;
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.heading}>{title}</Text>
      {right}
    </View>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10} style={styles.textLink}>
      <Text style={styles.textLinkText}>{label}</Text>
    </Pressable>
  );
}

export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  return <View accessibilityElementsHidden style={[styles.skeleton, { height }, style]} />;
}

export function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Panel tone="blush" style={styles.inlineError}>
      <Text accessibilityRole="alert" style={type.error}>
        {message}
      </Text>
      <Button label="Retry" variant="secondary" onPress={onRetry} style={styles.retry} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  raised: { boxShadow: shadows.panel },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 1,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  button: {
    minHeight: minTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: 18,
  },
  buttonShadow: { boxShadow: shadows.control },
  buttonPressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
  buttonText: { fontFamily: fonts.bold, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  disabled: { opacity: 0.5 },
  dashed: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.input,
    borderRadius: radii.lg,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  backText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primaryInk, textDecorationLine: 'underline' },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  mark: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  checkbox: { borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primary },
  radio: { borderRadius: radii.pill },
  radioDot: { width: 10, height: 10, borderRadius: radii.pill, backgroundColor: colors.foreground },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textLink: { minHeight: minTarget, justifyContent: 'center' },
  textLinkText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primaryInk,
    textDecorationLine: 'underline',
  },
  skeleton: {
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.muted,
  },
  inlineError: { padding: 14, gap: 10 },
  retry: { alignSelf: 'flex-start' },
});
