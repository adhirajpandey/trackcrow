import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import { onboarding, canImportStoredSms } from './onboarding';
import { requireNativeModule } from 'expo';
import { readStoredCredentials } from './credential-store';
import { createSmsImporter, type IncomingSms } from './sms-import';
import { createPaymentLocation } from './payment-location';

const QUEUE_KEY = 'trackcrow.smsImports.v1';
const LOCATION_KEY = 'trackcrow.paymentLocation.v1';
// A last known fix up to ten minutes old, else one quick fix capped at three seconds.
const LOCATION_MAX_AGE_MS = 10 * 60 * 1000;
const LOCATION_TIMEOUT_MS = 3000;
const native = requireNativeModule<{
  sessionFingerprint(apiUrl: string, token: string): string;
  lastLocation?(maxAgeMs: number, timeoutMs: number): Promise<string | null>;
}>('TrackCrowSms');
const { ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION } = PermissionsAndroid.PERMISSIONS;

async function readLocationEnabled() {
  return (await AsyncStorage.getItem(LOCATION_KEY)) === 'on';
}

async function locate(): Promise<string | null> {
  if (!native.lastLocation) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      native.lastLocation(LOCATION_MAX_AGE_MS, LOCATION_TIMEOUT_MS),
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS + 1000); }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const smsImporter = createSmsImporter({
  readCredentials: async () => {
    const credentials = await readStoredCredentials();
    if (!credentials) return null;
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
  locationEnabled: readLocationEnabled,
  locate,
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

export const paymentLocation = createPaymentLocation({
  readEnabled: readLocationEnabled,
  writeEnabled: (enabled) => AsyncStorage.setItem(LOCATION_KEY, enabled ? 'on' : 'off'),
  checkAccess: async () => {
    const [fine, coarse] = await Promise.all([
      PermissionsAndroid.check(ACCESS_FINE_LOCATION),
      PermissionsAndroid.check(ACCESS_COARSE_LOCATION),
    ]);
    const foreground = fine || coarse;
    // Before Android 10, foreground location also covers background use.
    const background = foreground && (Number(Platform.Version) < 29 || (await PermissionsAndroid.check(ACCESS_BACKGROUND_LOCATION)));
    return { foreground, background };
  },
  requestForeground: async () => {
    // Asks for precise; Android 12+ lets the user pick approximate, which still counts.
    const result = await PermissionsAndroid.requestMultiple([ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION]);
    return Object.values(result).includes(PermissionsAndroid.RESULTS.GRANTED);
  },
  requestBackground: async () => {
    if (Number(Platform.Version) < 29) return 'granted';
    // Android 11+ opens the app's location permission screen instead of a dialog.
    return PermissionsAndroid.request(ACCESS_BACKGROUND_LOCATION);
  },
  clearQueuedLocations: () => smsImporter.clearLocations(),
});

export async function handleIncomingSms(input: IncomingSms): Promise<void> {
  try {
    await smsImporter.handleIncoming(input);
  } catch {
    // Never log task data, credentials, SMS text, or HTTP exception contents.
  }
}
