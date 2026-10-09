import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid } from 'react-native';
import { onboarding, canImportStoredSms } from './onboarding';
import { requireOptionalNativeModule } from 'expo';
import { readStoredCredentials } from './credential-store';
import { createSmsImporter, type IncomingSms } from './sms-import';

const QUEUE_KEY = 'trackcrow.smsImports.v1';
const native = requireOptionalNativeModule<{ sessionFingerprint(apiUrl: string, token: string): string }>('TrackCrowSms');

export const smsImporter = createSmsImporter({
  readCredentials: async () => {
    const credentials = await readStoredCredentials();
    if (!credentials || !native) return null;
    return { ...credentials, owner: native.sessionFingerprint(credentials.apiUrl, credentials.token) };
  },
  canImport: async (credentials) => {
    const setup = await onboarding.read(credentials.apiUrl);
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
    return canImportStoredSms(setup, granted ? 'granted' : 'denied');
  },
  readState: () => AsyncStorage.getItem(QUEUE_KEY),
  writeState: (state) => AsyncStorage.setItem(QUEUE_KEY, state),
  removeState: () => AsyncStorage.removeItem(QUEUE_KEY),
  now: Date.now,
  post: async (credentials, payload) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${credentials.apiUrl}/api/imports/sms`, {
        method: 'POST', credentials: 'omit', signal: controller.signal,
        headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.status;
    } finally {
      clearTimeout(timeout);
    }
  },
});

export async function handleIncomingSms(input: IncomingSms): Promise<void> {
  try {
    await smsImporter.handleIncoming(input);
  } catch {
    // Never log task data, credentials, SMS text, or HTTP exception contents.
  }
}
