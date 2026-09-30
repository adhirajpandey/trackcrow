import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, minTarget, radii } from '../theme';
import { type } from './ui';
export type TextFieldProps = TextInputProps & { label: string; error?: string; hint?: string };
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, style, ...props },
  ref,
) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.mutedForeground}
        {...props}
        style={[styles.input, style]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={type.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={type.muted}>{hint}</Text>
      ) : null}
    </View>
  );
});
const styles = StyleSheet.create({
  field: { gap: 6 },
  input: {
    minHeight: minTarget + 4,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.foreground,
  },
});
