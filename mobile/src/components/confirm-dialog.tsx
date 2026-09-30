import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Button, Panel, type } from './ui';
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!busy) onClose();
          }}
          accessibilityLabel="Dismiss confirmation"
          accessibilityRole="button"
        />
        <Panel raised style={{ padding: 20, gap: 12, width: '100%', maxWidth: 420 }}>
          <View accessibilityViewIsModal style={{ gap: 12 }}>
            <Text accessibilityRole="header" style={type.heading}>
              {title}
            </Text>
            <Text style={type.body}>{message}</Text>
            <Button
              label={busy ? 'Please wait' : confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              onPress={onConfirm}
              disabled={busy}
            />
            <Button label="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
          </View>
        </Panel>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.foreground}80`,
    padding: 24,
  },
});
