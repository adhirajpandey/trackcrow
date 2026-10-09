import storage from '@react-native-async-storage/async-storage';
import { requireNativeModule } from 'expo';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { DEFAULT_API_URL, normalizeApiUrl } from './api/client';
import { createSmsConfigSync } from './sms-config';

/** Launch/sign-in force a fetch; foreground transitions share a four-hour throttle. */
export function useSmsConfig(apiUrl: string | null, sessionToken: string | null) {
  useEffect(() => {
    let active = true;
    let remove: (() => void) | undefined;
    async function start() {
      if (!active || Platform.OS !== 'android') return;
      const url = normalizeApiUrl(apiUrl ?? DEFAULT_API_URL);
      const key = `trackcrow.smsConfig.v1:${url}`;
      const native = requireNativeModule<{ setSenderConfig(json: string): boolean }>('TrackCrowSms');
      const sync = createSmsConfigSync({
        readCache: () => storage.getItem(key),
        writeCache: (json) => storage.setItem(key, json),
        setNative: (json) => active && native.setSenderConfig(json),
        now: Date.now,
        fetchConfig: async (etag) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            return await fetch(`${url}/api/mobile/config`, {
              credentials: 'omit', signal: controller.signal,
              headers: etag ? { 'If-None-Match': etag } : {},
            });
          } finally { clearTimeout(timeout); }
        },
      });
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') void sync.refresh();
      });
      remove = () => subscription.remove();
      await sync.refresh(true);
    }
    void start().catch(() => { /* Older native clients retain their bundled allowlist. */ });
    return () => { active = false; remove?.(); };
  }, [apiUrl, sessionToken]);
}
