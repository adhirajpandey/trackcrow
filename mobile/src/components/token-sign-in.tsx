// Personal access token fallback for Settings. Remove this file, its usage in
// settings.tsx, and connectWithToken to drop the fallback.
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { useCredentials } from '../lib/credentials';
import { colors } from '../theme';
import { Button, TextLink, type } from './ui';

export function TokenSignIn({
  apiUrl,
  inputStyle,
  onConnected,
}: {
  apiUrl: string;
  inputStyle: StyleProp<TextStyle>;
  onConnected: () => void;
}) {
  const { connectWithToken } = useCredentials();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    setError(null);
    setBusy(true);
    try {
      await connectWithToken(apiUrl, token);
      setToken('');
      onConnected();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect to TrackCrow.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <TextLink label="Use an access token instead" onPress={() => setOpen(true)} />;

  return (
    <View style={styles.section}>
      <Text style={type.muted}>
        Create an access token with transactions:read and sms:import in web Settings. This phone keeps
        it in secure storage.
      </Text>
      <Text style={type.label}>Access token</Text>
      <TextInput
        accessibilityLabel="Access token"
        testID="access-token-input"
        style={inputStyle}
        value={token}
        onChangeText={setToken}
        placeholder="Paste your token"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        editable={!busy}
      />
      {error ? (
        <Text accessibilityRole="alert" style={type.error}>
          {error}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator color={colors.foreground} accessibilityLabel="Checking access" /> : null}
      <Button
        label="Connect with token"
        variant="secondary"
        onPress={() => void connect()}
        disabled={busy || !apiUrl.trim() || !token.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: colors.secondary },
});
