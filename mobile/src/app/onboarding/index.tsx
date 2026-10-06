import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { MessageSquareMore, Smartphone } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/app-header';
import { MenuRow } from '../../components/menu-row';
import { PageHeading } from '../../components/transactions/shared';
import { Button, InfoNote, Panel, type } from '../../components/ui';
import { TextField } from '../../components/text-field';
import { useToast } from '../../components/toast-host';
import { useCredentials } from '../../lib/credentials';
import { DEFAULT_API_URL } from '../../lib/api/client';
import { fetchAccounts, updateAccount } from '../../lib/api/accounts';
import { sendDiagnosticReport } from '../../lib/api/diagnostics';
import { onboarding } from '../../lib/onboarding';
import { readCachedSmsConfig } from '../../lib/sms-config';
import { useSmsIngestion } from '../../lib/sms-ingestion';
import { debugLog } from '../../lib/debug-log';
import Constants from 'expo-constants';
import { colors, fonts, radii } from '../../theme';

type Step = 'welcome' | 'signin' | 'bank' | 'unsupported' | 'sms' | 'permission' | 'accounts' | 'done';
export default function OnboardingScreen() {
  const { state, signInWithGoogle } = useCredentials();
  const credentials = state.status === 'ready' ? state.credentials : null;
  const apiUrl = credentials?.apiUrl ?? DEFAULT_API_URL;
  const sms = useSmsIngestion();
  const toast = useToast();
  const cache = useQueryClient();
  const [step, setStep] = useState<Step>('welcome');
  const [history, setHistory] = useState<Step[]>([]);
  const [banks, setBanks] = useState(['Kotak', 'HDFC']);
  const [bankRequest, setBankRequest] = useState('');
  const [mode, setMode] = useState<'manual' | 'sms'>('manual');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const accounts = useQuery({
    queryKey: ['onboarding-accounts', apiUrl],
    queryFn: ({ signal }) => fetchAccounts(credentials!, signal),
    enabled: !!credentials && step === 'accounts',
  });
  useEffect(() => {
    debugLog.write('onboarding.step', { step });
  }, [step]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void readCachedSmsConfig(apiUrl).then((names) => {
        if (active) setBanks(names.split(', ').filter(Boolean));
      });
      return () => {
        active = false;
      };
    }, [apiUrl]),
  );
  function next(value: Step) {
    setError(null);
    setHistory((previous) => [...previous, step]);
    setStep(value);
  }
  function back() {
    setError(null);
    setStep(history.at(-1) ?? 'welcome');
    setHistory((previous) => previous.slice(0, -1));
  }
  const onBack = history.length ? back : router.canGoBack() ? () => router.back() : undefined;
  async function work(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not complete this step. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function manual() {
    await onboarding.save(apiUrl, { complete: false, mode: 'manual' });
    setMode('manual');
    next('accounts');
  }
  async function allow() {
    const start = Date.now();
    const result = await sms.grant();
    setMode(result === 'granted' ? 'sms' : 'manual');
    // The provider checks Android again after requesting. A rapid denial may mean a sideload restriction.
    setBlocked(Date.now() - start < 1000);
    next('permission');
  }
  async function finish() {
    await onboarding.save(apiUrl, { complete: true, mode });
    cache.clear();
    router.replace('/');
  }
  const titles: Record<Step, string> = {
    welcome: 'Welcome to TrackCrow',
    signin: 'Your ledger, on this phone',
    bank: 'Which bank sends your transaction SMS?',
    unsupported: 'Manual tracking works for every bank',
    sms: 'New bank SMS, tracked automatically',
    permission: sms.permission === 'granted' ? 'SMS access is ready' : 'You can keep tracking manually',
    accounts: 'Name your accounts',
    done: 'You’re ready',
  };
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader section="Setup" />
      <PageHeading heading="Setup" onBack={busy ? undefined : onBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'sms' ? (
          <Panel tone="mint" style={styles.illustration}>
            <Smartphone size={88} color={colors.foreground} strokeWidth={1.5} />
            <View style={styles.bubble}>
              <MessageSquareMore size={26} color={colors.foreground} />
            </View>
          </Panel>
        ) : null}
        <Panel raised={step !== 'sms'} tone={step === 'welcome' ? 'mint' : 'paper'} style={step === 'sms' ? styles.plain : styles.panel}>
          <Text style={step === 'sms' || step === 'bank' ? styles.title : type.heading}>{titles[step]}</Text>
          {step === 'welcome' ? (
            <>
              <Text style={type.body}>
                TrackCrow brings your expenses into one ledger. Capture new supported bank debit SMS, add
                expenses manually, and give each transaction a category.
              </Text>
              <Button
                label="Get started"
                disabled={busy}
                onPress={() =>
                  void work(async () => {
                    await onboarding.save(apiUrl, { complete: false, mode: 'manual' });
                    next(credentials ? 'bank' : 'signin');
                  })
                }
              />
            </>
          ) : null}
          {step === 'signin' ? (
            <>
              <Text style={type.body}>
                Sign in with the Google account you use for TrackCrow. Your ledger stays in sync with the web
                app.
              </Text>
              <Button
                label="Sign in with Google"
                disabled={busy || state.status === 'loading'}
                onPress={() =>
                  void work(async () => {
                    const result = await signInWithGoogle(apiUrl);
                    if (result.status === 'signed-in') {
                      cache.clear();
                      next('bank');
                    }
                  })
                }
              />
              <Button
                label="Open Settings"
                variant="secondary"
                disabled={busy}
                onPress={() => router.push('/settings')}
              />
              {credentials ? <Button label="Continue" disabled={busy} onPress={() => next('bank')} /> : null}
            </>
          ) : null}
          {step === 'bank' ? (
            <>
              <Text style={type.muted}>
                Only new messages from supported bank senders are imported. Past SMS are never read.
              </Text>
              {banks.map((bank) => (
                <MenuRow key={bank} label={bank} onPress={busy ? undefined : () => next('sms')} />
              ))}
              <MenuRow
                label="My bank isn't supported"
                onPress={busy ? undefined : () =>
                  void work(async () => {
                    await onboarding.save(apiUrl, { complete: false, mode: 'manual' });
                    setMode('manual');
                    next('unsupported');
                  })
                }
              />
            </>
          ) : null}
          {step === 'unsupported' ? (
            <>
              <Text style={type.body}>
                Your bank’s SMS cannot be imported yet. You can add expenses and categorize them manually.
                This path does not request SMS permission.
              </Text>
              <TextField
                label="Request my bank (optional)"
                value={bankRequest}
                maxLength={100}
                onChangeText={setBankRequest}
                editable={!busy}
              />
              <Button
                label="Request my bank"
                disabled={busy || !bankRequest.trim() || !credentials}
                variant="secondary"
                onPress={() =>
                  void work(async () => {
                    if (!credentials) return;
                    await sendDiagnosticReport(credentials, {
                      kind: 'bank_request',
                      appVersion: Constants.expoConfig?.version ?? 'unknown',
                      versionCode:
                        Constants.platform?.android?.versionCode ??
                        Constants.expoConfig?.android?.versionCode ??
                        0,
                      device: {},
                      note: bankRequest.trim(),
                      entries: [],
                    });
                    toast({ message: 'Bank request sent.' });
                    setBankRequest('');
                  })
                }
              />
              <Button label="Continue in manual mode" disabled={busy} onPress={() => void work(manual)} />
            </>
          ) : null}
          {step === 'sms' ? (
            <>
              <Text style={type.body}>
                TrackCrow only reads new SMS from supported banks. OTPs are dropped on this phone.
              </Text>
              <Text style={type.body}>
                The server pulls out the amount, recipient, and reference, then discards the text.
              </Text>
              <InfoNote>Past SMS are never read. Unsent messages are deleted after 7 days or on sign-out.</InfoNote>
              <Button label="Allow SMS access" disabled={busy} onPress={() => void work(allow)} />
              <Button
                label="Use manual tracking instead"
                disabled={busy}
                variant="secondary"
                onPress={() => void work(manual)}
              />
            </>
          ) : null}
          {step === 'permission' ? (
            <>
              {sms.permission === 'granted' ? (
                <>
                  <Text style={type.body}>New supported bank debits will appear automatically.</Text>
                  <Button
                    label="Continue"
                    disabled={busy}
                    onPress={() =>
                      void work(async () => {
                        setMode('sms');
                        await onboarding.save(apiUrl, { complete: false, mode: 'sms' });
                        next('accounts');
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Text style={type.body}>SMS permission was not granted. Manual expenses still work.</Text>
                  {blocked || sms.permission === 'never_ask_again' ? (
                    <Text style={type.body}>
                      If no Android dialog appeared, this sideloaded app may be blocked by restricted
                      settings. Open App info → ⋮ → Allow restricted settings, then come back and retry. If
                      you previously denied access, enable SMS in App info → Permissions.
                    </Text>
                  ) : null}
                  <Button
                    label="Open app settings"
                    disabled={busy}
                    variant="secondary"
                    onPress={() => void work(() => Linking.openSettings())}
                  />
                  <Button label="Retry SMS access" disabled={busy} onPress={() => void work(allow)} />
                </>
              )}
              <Button
                label="Use manual tracking instead"
                disabled={busy}
                variant="secondary"
                onPress={() => void work(manual)}
              />
            </>
          ) : null}
          {step === 'accounts' ? (
            <>
              <Text style={type.muted}>
                Optional: give imported accounts names you recognize. You can also do this later in More →
                Accounts.
              </Text>
              {accounts.isPending ? <Text style={type.muted}>Loading accounts…</Text> : null}
              {accounts.isError ? (
                <Text style={type.error}>Could not load accounts. You can skip this step.</Text>
              ) : null}
              {accounts.data?.map((account) => (
                <View key={account.uuid} style={{ gap: 8 }}>
                  <TextField
                    label={`Account: ${account.name}`}
                    value={names[account.uuid] ?? account.name}
                    onChangeText={(name) => setNames((current) => ({ ...current, [account.uuid]: name }))}
                    editable={!busy}
                    maxLength={100}
                  />
                </View>
              ))}
              {accounts.data?.length ? (
                <Button
                  label="Save names"
                  disabled={busy}
                  onPress={() =>
                    void work(async () => {
                      for (const account of accounts.data ?? [])
                        if (names[account.uuid] !== undefined && names[account.uuid].trim() !== account.name)
                          await updateAccount(credentials!, account.uuid, names[account.uuid]);
                      await cache.invalidateQueries();
                      next('done');
                    })
                  }
                />
              ) : null}
              <Button label="Skip" disabled={busy} variant="secondary" onPress={() => next('done')} />
            </>
          ) : null}
          {step === 'done' ? (
            <>
              <Text style={type.body}>
                {mode === 'sms'
                  ? 'New supported bank SMS will join your ledger. Review uncategorized transactions from Overview.'
                  : 'Add expenses manually from Overview or Transactions. Run setup again in Settings whenever you want SMS import.'}
              </Text>
              <Button label="Open Overview" disabled={busy} onPress={() => void work(finish)} />
            </>
          ) : null}
          {error ? (
            <Text accessibilityRole="alert" style={type.error}>
              {error}
            </Text>
          ) : null}
        </Panel>
        {step === 'welcome' ? (
          <Panel tone="lilac" style={styles.panel}>
            <Text style={styles.nextTitle}>What happens next?</Text>
            {[
              ['Pick your bank', 'Choose which bank sends your transaction SMS.'],
              ['Allow SMS access', 'TrackCrow only acts on messages from supported bank senders.'],
              ['Start tracking', 'New messages are imported automatically.'],
            ].map(([title, body], index) => (
              <View key={title} style={styles.step}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.stepTitle}>{title}</Text>
                  <Text style={type.muted}>{body}</Text>
                </View>
              </View>
            ))}
          </Panel>
        ) : null}
        {step === 'bank' ? (
          <InfoNote>You can still use manual tracking to add transactions from any bank at any time.</InfoNote>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  panel: { padding: 16, gap: 14 },
  plain: { padding: 0, gap: 14, borderWidth: 0, backgroundColor: 'transparent' },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.foreground },
  illustration: { height: 170, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    position: 'absolute',
    top: 34,
    left: '55%',
    padding: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  nextTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.foreground },
  step: { flexDirection: 'row', gap: 12 },
  number: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  numberText: { fontFamily: fonts.bold, fontSize: 14, color: colors.foreground },
  stepTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.foreground },
  flex: { flex: 1, gap: 2 },
});
