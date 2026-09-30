import { StyleSheet, Text } from 'react-native';
import { useState } from 'react';
import { useSmsIngestion } from '../lib/sms-ingestion';
import { formatTransactionTime } from '../lib/format';
import { Button, Panel, type } from './ui';

export function SmsImportStatus() {
  const status = useSmsIngestion();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const last = status.lastImportAt === null ? 'no imports yet' : `last import ${formatTransactionTime(new Date(status.lastImportAt).toISOString())}`;

  async function grant() {
    setError(null);
    setBusy(true);
    try { await status.grant(); }
    catch { setError('Could not request SMS permission. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <Panel style={styles.panel}>
      <Text style={type.label}>SMS import</Text>
      <Text style={type.body} accessibilityLiveRegion="polite">
        {status.authError ? 'Sign in again' : status.permission !== 'granted' ? 'No SMS permission' : `Active: ${last} · ${status.pending} pending`}
      </Text>
      {!status.authError && status.permission !== 'granted' ? (
        <Button label={status.permission === 'never_ask_again' ? 'Open app settings' : 'Grant'} onPress={() => void grant()} disabled={busy} />
      ) : null}
      {error ? <Text style={type.error} accessibilityRole="alert">{error}</Text> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({ panel: { padding: 16, gap: 10 } });
