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
      if (raw === null) return null;
      // Only an absent record qualifies for the legacy upgrade exception.
      try {
        const value = JSON.parse(raw);
        return value && typeof value.complete === 'boolean' && ['manual', 'sms'].includes(value.mode)
          ? value
          : { complete: false, mode: 'manual' };
      } catch {
        return { complete: false, mode: 'manual' };
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
  async () => {
    // Defer native storage for unit tests, but keep it in Metro's main bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage')).default;
  },
);
export { DEFAULT_API_URL };

export function useSetupMode(apiUrl: string) {
  const [setup, setSetup] = useState<{ apiUrl: string; mode: SetupState['mode'] | null } | null>(null);
  useEffect(() => {
    let active = true;
    let latestRead = 0;
    const update = () => {
      const read = ++latestRead;
      void onboarding
        .read(apiUrl)
        .then((value) => {
          if (active && read === latestRead) setSetup({ apiUrl, mode: value?.mode ?? null });
        })
        .catch(() => {
          if (active && read === latestRead) setSetup({ apiUrl, mode: 'manual' });
        });
    };
    update();
    const remove = subscribeSetup(update);
    return () => {
      active = false;
      remove();
    };
  }, [apiUrl]);
  return { mode: setup?.apiUrl === apiUrl ? setup.mode : null, ready: setup?.apiUrl === apiUrl };
}

export function canImportSms(mode: SetupState['mode'] | null, permission: string) {
  return mode === 'sms' && permission === 'granted';
}

/** An absent record with permission is the pre-onboarding upgrade path. */
export function canImportStoredSms(setup: SetupState | null, permission: string) {
  return permission === 'granted' && (setup === null || canImportSms(setup.mode, permission));
}
