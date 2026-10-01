import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp, LogIn, LogOut, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/screen-header';
import { SmsImportStatus } from '../components/sms-import-status';
import { TokenSignIn } from '../components/token-sign-in';
import { Button, Panel, type } from '../components/ui';
import { DEFAULT_API_URL } from '../lib/api';
import { useCredentials } from '../lib/credentials';
import { colors, fonts, radii } from '../theme';

const appVersion = `Version ${Constants.expoConfig?.version ?? 'unknown'} (${Constants.expoConfig?.android?.versionCode ?? '?'})`;

export default function SettingsScreen() {
  const { state, signInWithGoogle, disconnect } = useCredentials();
  const queryClient = useQueryClient();
  const saved = state.status === 'ready' ? state.credentials : null;
  const [apiUrl, setApiUrl] = useState(saved?.apiUrl ?? DEFAULT_API_URL);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  function connected() {
    queryClient.clear();
    router.navigate('/');
  }

  async function googleSignIn() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await signInWithGoogle(apiUrl);
      if (result.status === 'signed-in') connected();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in to TrackCrow.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!saved) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    setApiUrl(saved.apiUrl);
    try {
      const revocation = await disconnect();
      if (revocation === 'failed') {
        setNotice('Signed out on this device, but the server token could not be revoked.');
      }
    } catch {
      setNotice('Signed out, but this phone could not clear its saved credentials.');
    } finally {
      queryClient.clear();
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader section="Settings" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.note}>connect this phone</Text>
        {notice ? (
          <Panel tone="blush" style={styles.notice}>
            <Text accessibilityRole="alert" style={type.error}>
              {notice}
            </Text>
          </Panel>
        ) : null}
        {saved ? (
          <Panel raised style={styles.panel}>
            <View style={styles.titleRow}>
              <UserRound size={20} color={colors.foreground} />
              <Text style={type.heading}>Account</Text>
            </View>
            <View style={styles.connected}>
              <Text style={type.label}>{saved.method === 'google' ? 'Signed in as' : 'Connected with'}</Text>
              <Text style={type.body} numberOfLines={1}>
                {saved.method === 'google' ? saved.email : 'An access token'}
              </Text>
            </View>
            {busy ? <ActivityIndicator color={colors.foreground} accessibilityLabel="Signing out" /> : null}
            <Button
              label="Sign out"
              icon={LogOut}
              variant="destructive"
              onPress={() => void signOut()}
              disabled={busy}
            />
          </Panel>
        ) : (
          <Panel raised style={styles.panel}>
            <View style={styles.titleRow}>
              <LogIn size={20} color={colors.foreground} />
              <Text style={type.heading}>Sign in</Text>
            </View>
            <Text style={type.muted}>
              Use the Google account you sign in with on the web. This phone keeps a revocable TrackCrow token
              in secure storage.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={type.error}>
                {error}
              </Text>
            ) : null}
            {busy ? <ActivityIndicator color={colors.foreground} accessibilityLabel="Signing in" /> : null}
            <Button
              label="Sign in with Google"
              onPress={() => void googleSignIn()}
              disabled={busy || !apiUrl.trim()}
            />
          </Panel>
        )}
        {saved ? <SmsImportStatus /> : null}
        <Panel style={styles.panel}>
          <Button
            label={advanced ? 'Advanced · Hide' : 'Advanced · Show'}
            trailingIcon={advanced ? ChevronUp : ChevronDown}
            variant="secondary"
            disabled={busy}
            onPress={() => setAdvanced((open) => !open)}
          />
          {advanced ? (
            <View style={{ gap: 10 }}>
              <Text style={type.muted}>Use a different server or connect with an access token.</Text>
              <Text style={type.label}>Server URL</Text>
              <TextInput
                accessibilityLabel="Server URL"
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder={DEFAULT_API_URL}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!busy}
              />
              <TokenSignIn apiUrl={apiUrl} inputStyle={styles.input} onConnected={connected} />
            </View>
          ) : null}
        </Panel>
        <Text style={[type.muted, styles.version]}>{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  panel: { padding: 16, gap: 10 },
  notice: { padding: 14 },
  version: { textAlign: 'center', paddingTop: 8 },
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
