import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import { useCredentials } from './credentials';
import { smsImporter } from './sms-import-native';
import { createSmsPermission, type SmsPermission } from './sms-permission';
import type { SmsImportStatus } from './sms-import';
import { useSmsConfig } from './sms-config';

const PERMISSION_KEY = 'trackcrow.smsPermissionDecision';
const smsPermission = createSmsPermission({
  check: () => PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
  request: () => PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
  readDecision: () => AsyncStorage.getItem(PERMISSION_KEY),
  writeDecision: (decision) => AsyncStorage.setItem(PERMISSION_KEY, decision),
});

type SmsIngestionStatus = SmsImportStatus & { permission: SmsPermission; grant: () => Promise<void> };
const SmsIngestionContext = createContext<SmsIngestionStatus | null>(null);

export function SmsIngestionProvider({ children }: { children: ReactNode }) {
  const { state } = useCredentials();
  const signedIn = state.status === 'ready';
  const sessionToken = signedIn ? state.credentials.token : null;
  const sessionApiUrl = signedIn ? state.credentials.apiUrl : null;
  useSmsConfig(sessionApiUrl, sessionToken);
  const [permission, setPermission] = useState<SmsPermission>('denied');
  const status = useSyncExternalStore(smsImporter.subscribe, smsImporter.getSnapshot, smsImporter.getSnapshot);

  useEffect(() => {
    if (!signedIn || Platform.OS !== 'android') return;
    let active = true;
    async function synchronize() {
      try {
        const result = await smsPermission.request(true);
        if (!active) return;
        setPermission(result);
        await smsImporter.refresh();
        if (active && result === 'granted') await smsImporter.drain();
      } catch {
        // Retry status on the next foreground transition; never log SMS or credentials.
      }
    }
    void synchronize();
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void synchronize(); });
    return () => { active = false; subscription.remove(); };
  }, [signedIn, sessionToken, sessionApiUrl]);

  const grant = useCallback(async () => {
    if (await smsPermission.check() === 'never_ask_again') {
      await Linking.openSettings();
      return;
    }
    const result = await smsPermission.request();
    setPermission(result);
    if (result === 'granted') await smsImporter.drain();
  }, []);

  return <SmsIngestionContext.Provider value={{ ...status, permission, grant }}>{children}</SmsIngestionContext.Provider>;
}

export function useSmsIngestion() {
  const status = useContext(SmsIngestionContext);
  if (!status) throw new Error('useSmsIngestion must be used inside SmsIngestionProvider');
  return status;
}
