import { useEffect } from 'react';
import { DEFAULT_API_URL, normalizeApiUrl } from './api/client';

export type SmsConfig = {
  schemaVersion: 1;
  configVersion: string;
  banks: { id: string; name: string; senderHeaders: string[] }[];
};

export const SMS_CONFIG_REFRESH_MS = 4 * 60 * 60 * 1000;

export function validateSmsConfig(value: unknown): value is SmsConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Record<string, unknown>;
  if (config.schemaVersion !== 1 || typeof config.configVersion !== 'string' ||
      config.configVersion.length < 1 || config.configVersion.length > 64 ||
      !Array.isArray(config.banks) || config.banks.length < 1 || config.banks.length > 100) return false;
  const ids = new Set<string>();
  let headers = 0;
  return config.banks.every((bank: unknown) => {
    if (!bank || typeof bank !== 'object') return false;
    const b = bank as Record<string, unknown>;
    if (typeof b.id !== 'string' || b.id.length < 1 || b.id.length > 64 || ids.has(b.id) ||
        typeof b.name !== 'string' || b.name.length < 1 || b.name.length > 100 ||
        !Array.isArray(b.senderHeaders) || b.senderHeaders.length < 1 || b.senderHeaders.length > 50) return false;
    ids.add(b.id);
    headers += b.senderHeaders.length;
    return headers <= 500 && b.senderHeaders.every((header: unknown) => typeof header === 'string' && /^[a-z0-9]{1,9}$/i.test(header));
  });
}

type ConfigDependencies = {
  readCache: () => Promise<string | null>;
  writeCache: (json: string) => Promise<void>;
  setNative: (json: string) => boolean;
  fetchConfig: (etag: string | null) => Promise<Response>;
  now: () => number;
};

/** Serializes refreshes and only commits validated, native-accepted configurations. */
export function createSmsConfigSync(deps: ConfigDependencies) {
  let config: SmsConfig | null = null;
  let etag: string | null = null;
  let lastFetch: number | null = null;
  let initialized = false;
  let inFlight: Promise<void> | null = null;

  async function refresh(force: boolean) {
    if (!initialized) {
      try {
        const stored = await deps.readCache();
        const cached = stored ? JSON.parse(stored) : null;
        if (cached && validateSmsConfig(cached.config) && deps.setNative(JSON.stringify(cached.config))) {
          config = cached.config;
          etag = typeof cached.etag === 'string' ? cached.etag : null;
        }
      } catch { /* Native SharedPreferences still retain the last working config. */ }
      initialized = true;
    }
    if (!force && lastFetch !== null && deps.now() - lastFetch < SMS_CONFIG_REFRESH_MS) return;
    lastFetch = deps.now();
    try {
      const response = await deps.fetchConfig(config ? etag : null);
      if (response.status === 304) return;
      if (!response.ok) return;
      // The server sends a small header list, never parsing expressions.
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > 65536) return;
      const next: unknown = JSON.parse(text);
      if (!validateSmsConfig(next) || !deps.setNative(JSON.stringify(next))) return;
      config = next;
      etag = response.headers.get('etag');
      await deps.writeCache(JSON.stringify({ config, etag, lastFetch }));
    } catch { /* A fetch or storage failure must leave the native config intact. */ }
  }

  return {
    refresh(force = false): Promise<void> {
      if (!inFlight) inFlight = refresh(force).finally(() => { inFlight = null; });
      return inFlight;
    },
    getSnapshot: () => ({ config, etag, lastFetch }),
  };
}

/** Launch/sign-in force a fetch; foreground transitions share a four-hour throttle. */
export function useSmsConfig(apiUrl: string | null, sessionToken: string | null) {
  useEffect(() => {
    let active = true;
    let remove: (() => void) | undefined;
    async function start() {
      const [{ AppState, Platform }, { default: storage }, { requireNativeModule }] = await Promise.all([
        import('react-native'), import('@react-native-async-storage/async-storage'), import('expo'),
      ]);
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
