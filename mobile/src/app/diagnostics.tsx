import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Linking, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/screen-header';
import { TextField } from '../components/text-field';
import { Button, Panel, type } from '../components/ui';
import { useToast } from '../components/toast-host';
import { useCredentials } from '../lib/credentials';
import { DEFAULT_API_URL, normalizeApiUrl } from '../lib/api/client';
import { sendDiagnosticReport, type DiagnosticReport } from '../lib/api/diagnostics';
import { debugLog } from '../lib/debug-log';
import { useSmsIngestion } from '../lib/sms-ingestion';
import { validateSmsConfig } from '../lib/sms-config';
import { colors } from '../theme';

export default function DiagnosticsScreen() {
  const { state } = useCredentials();
  const sms = useSmsIngestion();
  const toast = useToast();
  const credentials = state.status === 'ready' ? state.credentials : null;
  const apiUrl = credentials?.apiUrl ?? DEFAULT_API_URL;
  const [config, setConfig] = useState({ version: 'Bundled default', lastFetch: null as number | null });
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        AsyncStorage.getItem(`trackcrow.smsConfig.v1:${normalizeApiUrl(apiUrl)}`),
        debugLog.read(),
      ])
        .then(([raw, entries]) => {
          const cached = raw ? JSON.parse(raw) : null;
          if (active)
            setConfig({
              version: validateSmsConfig(cached?.config) ? cached.config.configVersion : 'Bundled default',
              lastFetch:
                entries.filter((entry) => entry.event.startsWith('sms.config.fetch.')).at(-1)?.ts ??
                (Number.isSafeInteger(cached?.lastFetch) ? cached.lastFetch : null),
            });
        })
        .catch(() => {
          if (active) setConfig({ version: 'Bundled default', lastFetch: null });
        });
      return () => {
        active = false;
      };
    }, [apiUrl]),
  );
  const android = Platform.OS === 'android' ? Platform.constants : null;
  const device = {
    androidVersion: android?.Release ?? String(Platform.Version),
    model: android?.Model ?? 'Unknown',
    smsPermission: sms.permission,
    smsImportEnabled: sms.enabled,
    smsConfigVersion: config.version,
    smsConfigLastFetch: config.lastFetch,
    pendingQueueItems: sms.pending,
    lastImportAt: sms.lastImportAt,
    signedIn: credentials !== null,
  };
  const appVersion = Constants.expoConfig?.version ?? 'unknown';
  const versionCode =
    Constants.platform?.android?.versionCode ?? Constants.expoConfig?.android?.versionCode ?? 0;
  async function buildPreview() {
    setBusy(true);
    setError(null);
    setPreview({
      kind: 'report',
      appVersion,
      versionCode,
      device,
      ...(note.trim() ? { note: note.trim() } : {}),
      entries: await debugLog.read(),
    });
    setBusy(false);
  }
  async function sendReport() {
    if (!credentials || !preview) return;
    setBusy(true);
    setError(null);
    try {
      await sendDiagnosticReport(credentials, preview);
      toast({ message: 'Diagnostic report sent.' });
      setPreview(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send report. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader section="Diagnostics" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Panel style={{ padding: 16, gap: 8 }}>
          <Text style={type.heading}>This phone</Text>
          <Text style={type.body}>
            App {appVersion} ({versionCode})
          </Text>
          <Text style={type.body}>
            Android {device.androidVersion} · {device.model}
          </Text>
          <Text style={type.body}>SMS permission: {sms.permission}</Text>
          <Text style={type.body}>SMS import: {sms.enabled ? 'On' : 'Off · manual tracking'}</Text>
          <Text style={type.body}>SMS config: {config.version}</Text>
          <Text style={type.body}>
            Last config fetch:{' '}
            {config.lastFetch ? new Date(config.lastFetch).toLocaleString() : 'Not recorded'}
          </Text>
          <Text style={type.body}>Pending queue: {sms.pending}</Text>
          <Text style={type.body}>
            Last import: {sms.lastImportAt ? new Date(sms.lastImportAt).toLocaleString() : 'No imports yet'}
          </Text>
          <Text style={type.body}>Account: {credentials ? 'Signed in' : 'Signed out'}</Text>
          <Button label="Open app settings" variant="secondary" onPress={() => void Linking.openSettings()} />
        </Panel>
        <Text style={type.muted}>
          Only Send report uploads this preview. Logs contain fixed diagnostic values. Your optional note is
          included exactly as shown; avoid personal or financial details.
        </Text>
        <TextField
          label="Optional note"
          value={note}
          multiline
          maxLength={4000}
          editable={!busy}
          onChangeText={(value) => {
            setNote(value);
            setPreview(null);
          }}
        />
        <Button label="Preview report" disabled={busy} onPress={() => void buildPreview()} />
        {preview ? (
          <Panel style={{ padding: 12 }}>
            <Text selectable style={type.body}>
              {JSON.stringify(preview, null, 2)}
            </Text>
          </Panel>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={type.error}>
            {error}
          </Text>
        ) : null}
        {!credentials ? <Text style={type.muted}>Sign in in Settings to send a report.</Text> : null}
        <Button
          label={busy ? 'Sending…' : 'Send report'}
          disabled={busy || !credentials || !preview}
          onPress={() => void sendReport()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
