import { TextField, type TextFieldProps } from './text-field';
export function AmountField(props: Omit<TextFieldProps, 'keyboardType' | 'label'> & { label?: string }) {
  return <TextField {...props} label={props.label ?? 'Amount (₹)'} keyboardType="decimal-pad" />;
}
