import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';
import { colors, fonts, minTarget, radii } from '../../theme';
import type { TextFieldProps } from '../text-field';
import { type } from '../ui';

// Same field appearance as TextField, with the sheet's keyboard integration.
export function SheetTextField({ label, hint, error, style, ...props }: TextFieldProps) {
  return <View style={{ gap: 6 }}>
    <Text style={type.label}>{label}</Text>
    <BottomSheetTextInput accessibilityLabel={label} placeholderTextColor={colors.mutedForeground}
      {...props} style={[{
        minHeight: minTarget + 4, borderWidth: 2, borderColor: colors.border,
        borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: colors.card, fontFamily: fonts.regular, fontSize: 15, color: colors.foreground,
      }, style]} />
    {error ? <Text accessibilityRole="alert" style={type.error}>{error}</Text> :
      hint ? <Text style={type.muted}>{hint}</Text> : null}
  </View>;
}
