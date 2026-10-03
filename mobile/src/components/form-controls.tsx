import { ChevronDown, ChevronRight, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, minTarget, radii } from '../theme';
import { type } from './ui';

export function FormField({
  label,
  required = false,
  optional = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text accessibilityRole="alert" style={type.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function FormInput({ prefix, multiline, style, ...props }: TextInputProps & { prefix?: string }) {
  return (
    <View style={[styles.box, multiline && styles.multiline]}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        {...props}
        style={[styles.text, multiline && styles.multilineText, style]}
      />
    </View>
  );
}

export function SelectRow({
  label,
  value,
  placeholder,
  icon: Icon,
  chevron = 'right',
  chosen = false,
  disabled = false,
  onPress,
  onClear,
}: {
  label: string;
  value?: string;
  placeholder: string;
  icon?: LucideIcon;
  chevron?: 'right' | 'down' | 'none';
  chosen?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onClear?: () => void;
}) {
  const Chevron = chevron === 'down' ? ChevronDown : ChevronRight;
  const tint = disabled ? colors.mutedForeground : colors.foreground;
  return (
    <View style={[styles.box, chosen && styles.chosen, disabled && styles.disabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ?? 'not set'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={styles.press}
      >
        {Icon ? <Icon size={18} color={tint} /> : null}
        <Text style={[value ? styles.value : styles.placeholder, disabled && styles.disabledText]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </Pressable>
      {onClear && value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label.toLocaleLowerCase()}`}
          hitSlop={12}
          disabled={disabled}
          onPress={onClear}
        >
          <X size={18} color={colors.foreground} />
        </Pressable>
      ) : null}
      {chevron !== 'none' ? (
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          disabled={disabled}
          onPress={onPress}
          hitSlop={8}
        >
          <Chevron size={18} color={tint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.secondaryForeground },
  required: { color: colors.destructiveInk },
  optional: { fontFamily: fonts.regular },
  box: {
    minHeight: minTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  multiline: { minHeight: 88, alignItems: 'flex-start' },
  prefix: { fontFamily: fonts.semibold, fontSize: 17, color: colors.foreground },
  text: { flex: 1, paddingVertical: 10, fontFamily: fonts.regular, fontSize: 16, color: colors.foreground },
  multilineText: { textAlignVertical: 'top' },
  press: { flex: 1, minHeight: minTarget, flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.foreground },
  placeholder: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.mutedForeground },
  chosen: { backgroundColor: colors.paperMint },
  disabled: { backgroundColor: colors.muted, borderColor: colors.input },
  disabledText: { color: colors.mutedForeground },
});
