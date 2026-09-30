import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Button } from './ui';
export function StickySaveBar({
  onSave,
  disabled = false,
  saving = false,
  label = 'Save',
}: {
  onSave: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Button label={saving ? 'Saving…' : label} onPress={onSave} disabled={disabled || saving} />
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { padding: 12, gap: 8, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.shell },
});
