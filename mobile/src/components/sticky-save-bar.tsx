import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Button } from './ui';
export function StickySaveBar({
  onSave,
  disabled = false,
  saving = false,
  label = 'Save',
  icon,
  secondary,
}: {
  onSave: () => void;
  disabled?: boolean;
  saving?: boolean;
  label?: string;
  icon?: LucideIcon;
  secondary?: { label: string; onPress: () => void; disabled?: boolean };
}) {
  const insets = useSafeAreaInsets();
  const save = (
    <Button
      label={saving ? 'Saving…' : label}
      trailingIcon={icon}
      onPress={onSave}
      disabled={disabled || saving}
      style={secondary ? styles.primary : undefined}
    />
  );
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {secondary ? (
        <View style={styles.row}>
          <Button
            label={secondary.label}
            variant="secondary"
            onPress={secondary.onPress}
            disabled={secondary.disabled}
            style={styles.secondary}
          />
          {save}
        </View>
      ) : (
        save
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { padding: 12, gap: 8, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.shell },
  row: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1 },
  primary: { flex: 2 },
});
