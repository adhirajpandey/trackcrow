import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import type { PaymentLocationState } from '../lib/payment-location';
import { usePaymentLocation } from '../lib/sms-ingestion';
import { colors, fonts } from '../theme';
import { ConfirmDialog } from './confirm-dialog';
import { Button, Panel, TextLink, type } from './ui';

export const PAYMENT_LOCATION_SUMMARY = 'Saves where you were when a bank SMS arrives. Only used for new imports.';

const labels: Record<PaymentLocationState, string> = {
  off: 'Off',
  on: 'On',
  needs_background: 'On – needs “Allow all the time”',
  blocked: 'Blocked in Android settings',
};

/** Turns payment location on, explaining background access before Android asks for it. */
export function usePaymentLocationSetup(onSettled?: () => void) {
  const location = usePaymentLocation();
  const [explaining, setExplaining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function askBackground() {
    setBusy(true);
    setError(null);
    try {
      // When Android will no longer prompt, its settings screen is the only way to grant it.
      if (!(await location.requestBackground())) await Linking.openSettings();
    } catch {
      // Keep the dialog open so the failure is visible; dismissing it still settles.
      setError('Could not open Android settings. Allow location “All the time” in App info → Permissions.');
      return;
    } finally {
      setBusy(false);
    }
    setExplaining(false);
    onSettled?.();
  }

  return {
    location,
    busy,
    async turnOn() {
      const state = await location.enable();
      if (state === 'needs_background') setExplaining(true);
      else onSettled?.();
    },
    explainBackground: () => {
      setError(null);
      setExplaining(true);
    },
    dialog: (
      <ConfirmDialog
        open={explaining}
        title="Allow location all the time"
        message={
          error ??
          'Bank SMS usually arrive while TrackCrow is closed. Android only shares location with a closed app when you choose “Allow all the time” on the next screen.'
        }
        confirmLabel="Continue"
        busy={busy}
        onConfirm={() => void askBackground()}
        onClose={() => {
          setError(null);
          setExplaining(false);
          onSettled?.();
        }}
      />
    ),
  };
}

export function PaymentLocationPanel() {
  const { location, busy, turnOn, explainBackground, dialog } = usePaymentLocationSetup();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const warn = location.state === 'needs_background' || location.state === 'blocked';
  const openSettings = () =>
    void Linking.openSettings().catch(() => setError('Could not open Android settings. Open App info → Permissions.'));

  async function toggle(value: boolean) {
    setError(null);
    setSaving(true);
    try {
      if (value) await turnOn();
      else await location.disable();
    } catch {
      setError('Could not change payment location. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel style={styles.panel}>
      <View style={styles.titleRow}>
        <MapPin size={20} color={colors.foreground} />
        <Text style={type.heading}>Payment location</Text>
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.label, styles.flex]}>Attach location to imported payments</Text>
        <Switch
          accessibilityLabel="Attach location to imported payments"
          value={location.enabled}
          disabled={!location.ready || saving || busy}
          onValueChange={(value) => void toggle(value)}
          trackColor={{ false: colors.secondary, true: colors.primary }}
          thumbColor={location.enabled ? colors.primaryInk : colors.card}
        />
      </View>
      <Text style={type.muted}>{PAYMENT_LOCATION_SUMMARY}</Text>
      <Text style={[styles.state, warn && styles.warn]}>{location.ready ? labels[location.state] : 'Checking…'}</Text>
      {location.state === 'needs_background' ? (
        <Button label="Allow all the time" variant="secondary" disabled={busy} onPress={explainBackground} />
      ) : null}
      {location.state === 'blocked' ? (
        <Button label="Open Android settings" variant="secondary" onPress={openSettings} />
      ) : null}
      {location.state === 'off' ? (
        <TextLink label="Revoke location permission in Android settings" onPress={openSettings} />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={type.error}>
          {error}
        </Text>
      ) : null}
      {dialog}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  state: { fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  warn: { color: colors.destructiveInk },
});
