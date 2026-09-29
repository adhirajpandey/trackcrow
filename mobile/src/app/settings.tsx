import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { KeyRound, LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/screen-header';
import { Button, Panel, type } from '../components/ui';
import { useCredentials } from '../lib/credentials';
import { colors, fonts, radii } from '../theme';

export default function SettingsScreen() {
  const { state, connect, disconnect } = useCredentials();
  const queryClient = useQueryClient();
  const saved = state.status === 'ready' ? state.credentials : null;
  const [apiUrl, setApiUrl] = useState(saved?.apiUrl ?? '');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await connect(apiUrl, token);
      queryClient.clear();
      setToken('');
      router.navigate('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect to TrackCrow.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await disconnect();
    queryClient.clear();
    setToken('');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader section="Settings" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.note}>connect this phone</Text>
        <Panel raised style={styles.panel}>
          <View style={styles.titleRow}>
            <KeyRound size={20} color={colors.foreground} />
            <Text style={type.heading}>Server and token</Text>
          </View>
          <Text style={type.muted}>
            Create a Read only access token in the web app under Settings. The token is stored in this
            phone&apos;s secure storage.
          </Text>
          {saved ? (
            <View style={styles.connected}>
              <Text style={type.label}>Connected to</Text>
              <Text style={type.body} numberOfLines={1}>
                {saved.apiUrl}
              </Text>
            </View>
          ) : null}
          <Text style={type.label}>Server URL</Text>
          <TextInput
            accessibilityLabel="Server URL"
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://trackcrow.example"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!busy}
          />
          <Text style={type.label}>Access token</Text>
          <TextInput
            accessibilityLabel="Access token"
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder={saved ? 'Enter a new token to replace the saved one' : 'Paste your token'}
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
            label={saved ? 'Save changes' : 'Connect'}
            onPress={() => void save()}
            disabled={busy || !apiUrl.trim() || !token.trim()}
          />
        </Panel>
        {saved ? (
          <Button label="Disconnect" icon={LogOut} variant="secondary" onPress={() => void signOut()} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  panel: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  connected: {
    gap: 2,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.paperMint,
  },
  input: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.foreground,
  },
});
