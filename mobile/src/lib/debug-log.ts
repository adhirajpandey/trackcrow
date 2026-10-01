export type DebugEntry = {
  ts: number;
  level: 'info' | 'warn' | 'error';
  event: string;
  attrs?: Record<string, boolean | number | string>;
};
const events = new Set([
  'sms.drain.ok',
  'sms.drain.retry',
  'sms.drain.auth_error',
  'sms.config.fetch.200',
  'sms.config.fetch.304',
  'sms.config.fetch.invalid',
  'api.error',
  'permission.changed',
  'onboarding.step',
]);
const paths = [
  '/api/accounts',
  '/api/accounts/:id',
  '/api/categories',
  '/api/categories/:id',
  '/api/subcategories',
  '/api/subcategories/:id',
  '/api/transactions',
  '/api/transactions/:id',
  '/api/transactions/:id/category',
  '/api/transactions/:id/suggest',
  '/api/recipients',
  '/api/recipients/:id',
  '/api/recipients/:id/detail',
  '/api/recipients/:id/aliases',
  '/api/rules',
  '/api/rules/:id',
  '/api/dashboard/summary',
  '/api/dashboard/spending-by-category',
  '/api/dashboard/spending-by-period',
  '/api/mobile/diagnostics',
  '/api/imports/sms',
];
const strings: Record<string, readonly string[]> = {
  path: paths,
  permission: ['granted', 'denied', 'never_ask_again'],
  step: ['welcome', 'signin', 'bank', 'unsupported', 'sms', 'permission', 'accounts', 'done'],
  reason: ['network', 'invalid', 'storage'],
};
export function debugPath(path: string): string | undefined {
  const clean = path.split('?')[0];
  return paths.find((template) => {
    const expected = template.split('/'),
      actual = clean.split('/');
    return (
      expected.length === actual.length &&
      expected.every((part, i) => (part === ':id' ? actual[i].length > 0 : part === actual[i]))
    );
  });
}
export function redactDebugAttrs(input: unknown): DebugEntry['attrs'] {
  if (!input || typeof input !== 'object') return undefined;
  const attrs: NonNullable<DebugEntry['attrs']> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.hasOwn(strings, key) && typeof value === 'string' && strings[key].includes(value))
      attrs[key] = value as string;
    if (key === 'status' && Number.isInteger(value) && (value as number) >= 100 && (value as number) <= 599)
      attrs[key] = value as number;
    if (key === 'pending' && Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 200)
      attrs[key] = value as number;
    if (key === 'signedIn' && typeof value === 'boolean') attrs[key] = value;
  }
  return Object.keys(attrs).length ? attrs : undefined;
}
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};
const KEY = 'trackcrow.debugLog.v1';
export function createDebugLog(storage: () => Promise<Storage>, now = Date.now) {
  let entries: DebugEntry[] = [];
  let tail = Promise.resolve();
  let initialized = false;
  async function initialize(store: Storage) {
    if (initialized) return;
    initialized = true;
    try {
      const raw = await store.getItem(KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(saved))
        entries = [
          ...saved
            .filter(
              (e) =>
                e &&
                events.has(e.event) &&
                Number.isSafeInteger(e.ts) &&
                ['info', 'warn', 'error'].includes(e.level),
            )
            .slice(-500)
            .map((e) => ({ ts: e.ts, level: e.level, event: e.event, attrs: redactDebugAttrs(e.attrs) })),
          ...entries,
        ].slice(-500);
    } catch {
      /* Logs are best effort. */
    }
  }
  return {
    write(event: string, attrs?: unknown, level: DebugEntry['level'] = 'info'): void {
      try {
        if (!events.has(event)) return;
        const entry = { ts: now(), level, event, attrs: redactDebugAttrs(attrs) };
        tail = tail
          .then(async () => {
            let store: Storage | undefined;
            try {
              store = await storage();
              await initialize(store);
            } catch {
              /* Keep the in-memory log. */
            }
            entries = [...entries, entry].slice(-500);
            if (store) await store.setItem(KEY, JSON.stringify(entries));
          })
          .catch(() => undefined);
      } catch {
        /* Never interrupt the caller or SMS queue. */
      }
    },
    async read(): Promise<DebugEntry[]> {
      const result = tail.then(async () => {
        try {
          await initialize(await storage());
        } catch {
          /* Return available logs. */
        }
        return entries.map((e) => ({ ...e, attrs: e.attrs ? { ...e.attrs } : undefined }));
      });
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
export const debugLog = createDebugLog(
  async () => {
    // Defer native storage for unit tests, but keep it in Metro's main bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage')).default;
  },
);
