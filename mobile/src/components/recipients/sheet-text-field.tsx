import { Text, View } from 'react-native';
import { FormField, FormInput } from '../form-controls';
import type { TextFieldProps } from '../text-field';
import { type } from '../ui';

/** The form field used across the app, with the sheet's keyboard integration. */
export function SheetTextField({ label, hint, error, ...props }: TextFieldProps) {
  return (
    <View>
      <FormField label={label} error={error}>
        <FormInput inSheet accessibilityLabel={label} {...props} />
      </FormField>
      {hint && !error ? <Text style={[type.muted, { marginTop: 4 }]}>{hint}</Text> : null}
    </View>
  );
}
