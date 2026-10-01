import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { useCredentials } from './credentials';
import { smsImporter } from './sms-import-native';
import { createSmsPermission, type SmsPermission } from './sms-permission';
import type { SmsImportStatus } from './sms-import';
import { useSmsConfig } from './sms-config';
import { DEFAULT_API_URL, onboarding, useSetupMode, canImportSms } from './onboarding';

const PERMISSION_KEY = 'trackcrow.smsPermissionDecision';
const smsPermission = createSmsPermission({
  check: () => PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
  request: () => PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS),
  readDecision: () => AsyncStorage.getItem(PERMISSION_KEY),
  writeDecision: (decision) => AsyncStorage.setItem(PERMISSION_KEY, decision),
});

type SmsIngestionStatus = SmsImportStatus & {
  permission: SmsPermission;
  enabled: boolean;
  ready: boolean;
  grant: () => Promise<SmsPermission>;
};
const SmsIngestionContext = createContext<SmsIngestionStatus | null>(null);

export function SmsIngestionProvider({ children }: { children: ReactNode }) {
  const { state } = useCredentials();
  const signedIn = state.status === 'ready';
  const sessionToken = signedIn ? state.credentials.token : null;
  const sessionApiUrl = signedIn ? state.credentials.apiUrl : null;
  useSmsConfig(sessionApiUrl, sessionToken);
  const { mode, ready: setupReady } = useSetupMode(sessionApiUrl ?? DEFAULT_API_URL);
  const [permission, setPermission] = useState<SmsPermission>('denied');
  const [permissionReady, setPermissionReady] = useState(Platform.OS !== 'android');
  const status = useSyncExternalStore(
    smsImporter.subscribe,
    smsImporter.getSnapshot,
    smsImporter.getSnapshot,
  );

  useEffect(() => {
    if (state.status === 'loading' || Platform.OS !== 'android') return;
    let active = true;
    async function synchronize() {
      try {
        const result = await smsPermission.check();
        if (!active) return;
        setPermission(result);
        setPermissionReady(true);
        await smsImporter.refresh();
        if (active && signedIn && canImportSms(mode, result)) await smsImporter.drain();
      } catch {
        if (active) setPermissionReady(true);
        // Retry status on the next foreground transition; never log SMS or credentials.
      }
    }
    void synchronize();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void synchronize();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [signedIn, sessionToken, sessionApiUrl, mode, state.status]);

  const grant = useCallback(async () => {
    if (!sessionApiUrl) throw new Error('Sign in before enabling SMS import.');
    // Only an explicit onboarding action can prompt, including retry after restricted settings.
    await smsPermission.request(false, true);
    const result = await smsPermission.check();
    await onboarding.save(sessionApiUrl, { complete: false, mode: result === 'granted' ? 'sms' : 'manual' });
    setPermission(result);
    setPermissionReady(true);
    if (result === 'granted') await smsImporter.drain();
    return result;
  }, [sessionApiUrl]);

  return (
    <SmsIngestionContext.Provider
      value={{
        ...status,
        permission,
        enabled: signedIn && canImportSms(mode, permission),
        ready: state.status !== 'loading' && setupReady && permissionReady,
        grant,
      }}
    >
      {children}
    </SmsIngestionContext.Provider>
  );
}

export function useSmsIngestion() {
  const status = useContext(SmsIngestionContext);
  if (!status) throw new Error('useSmsIngestion must be used inside SmsIngestionProvider');
  return status;
}
