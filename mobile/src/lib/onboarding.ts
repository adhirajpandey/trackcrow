import { useEffect, useState } from 'react';
import { DEFAULT_API_URL, normalizeApiUrl } from './api/client';
export type SetupState = { complete: boolean; mode: 'manual' | 'sms' };
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
const listeners = new Set<() => void>();
export function subscribeSetup(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function createOnboarding(storage: () => Promise<Storage>) {
  const key = (url: string) => `trackcrow.onboarding.v1:${normalizeApiUrl(url)}`;
  return {
    async read(url: string): Promise<SetupState | null> {
      const raw = await (await storage()).getItem(key(url));
      try {
        const value = raw ? JSON.parse(raw) : null;
        return value && typeof value.complete === 'boolean' && ['manual', 'sms'].includes(value.mode)
          ? value
          : null;
      } catch {
        return null;
      }
    },
    async save(url: string, value: SetupState) {
      await (await storage()).setItem(key(url), JSON.stringify(value));
      listeners.forEach((listener) => listener());
    },
    async clear(url: string) {
      // Retain an explicit incomplete state so an upgrade check cannot skip a rerun.
      await this.save(url, { complete: false, mode: 'manual' });
    },
  };
}
export function shouldSkipOnboarding(
  setup: SetupState | null,
  signedIn: boolean,
  permissionGranted: boolean,
  previouslyDecided: boolean,
) {
  return setup?.complete === true || (setup === null && signedIn && (permissionGranted || previouslyDecided));
}
export const onboarding = createOnboarding(
  async () => (await import('@react-native-async-storage/async-storage')).default,
);
export { DEFAULT_API_URL };

export function useSetupMode(apiUrl: string) {
  const [mode, setMode] = useState<SetupState['mode'] | null>(null);
  useEffect(() => {
    let active = true;
    const update = () => {
      void onboarding
        .read(apiUrl)
        .then((value) => {
          if (active) setMode(value?.mode ?? null);
        })
        .catch(() => {
          if (active) setMode('manual');
        });
    };
    update();
    const remove = subscribeSetup(update);
    return () => {
      active = false;
      remove();
    };
  }, [apiUrl]);
  return mode;
}

export function canImportSms(mode: SetupState['mode'] | null, permission: string) {
  return mode === 'sms' && permission === 'granted';
}
