import { debugLog } from './debug-log';
// Queue and HTTP outcomes are kept free of native imports for node:test.
export const SMS_QUEUE_LIMIT = 200;
export const SMS_QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAIN_BUDGET_MS = 40_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type IncomingSms = { sender: string; body: string; receivedAt: number; idempotencyKey: string };
export type SmsQueueItem = IncomingSms & { enqueuedAt: number };
export type SmsCredentials = { apiUrl: string; token: string; owner: string };
export type SmsImportStatus = { pending: number; lastImportAt: number | null; authError: 401 | 403 | null };
type QueueState = Omit<SmsImportStatus, 'pending'> & { owner: string; items: SmsQueueItem[] };
export type SmsImportPayload = {
  data: { message: string; sender: string; idempotencyKey: string; timestamp: string };
  metadata: { storeMessageBody: false };
};
export type SmsImportDeps = {
  readCredentials: () => Promise<SmsCredentials | null>;
  canImport: (credentials: SmsCredentials) => Promise<boolean>;
  readState: () => Promise<string | null>;
  writeState: (state: string) => Promise<void>;
  removeState: () => Promise<void>;
  post: (credentials: SmsCredentials, payload: SmsImportPayload) => Promise<number>;
  now: () => number;
};

const EMPTY_STATUS: SmsImportStatus = { pending: 0, lastImportAt: null, authError: null };

function isIncomingSms(value: unknown): value is IncomingSms {
  if (!value || typeof value !== 'object') return false;
  const sms = value as IncomingSms;
  return typeof sms.sender === 'string' && sms.sender.length > 0 && sms.sender.length <= 64
    && typeof sms.body === 'string' && sms.body.length > 0 && sms.body.length <= 4096
    && typeof sms.idempotencyKey === 'string' && UUID.test(sms.idempotencyKey)
    && Number.isSafeInteger(sms.receivedAt) && sms.receivedAt >= 0 && sms.receivedAt <= 8.64e15;
}

function readQueue(raw: string | null, owner: string, now: number): QueueState {
  const empty: QueueState = { owner, items: [], lastImportAt: null, authError: null };
  if (!raw) return empty;
  try {
    const stored = JSON.parse(raw) as QueueState;
    if (stored.owner !== owner || !Array.isArray(stored.items)) return empty;
    const keys = new Set<string>();
    const items = stored.items.filter((item) => {
      if (!isIncomingSms(item) || !Number.isSafeInteger(item.enqueuedAt)
        || item.enqueuedAt > now || now - item.enqueuedAt >= SMS_QUEUE_TTL_MS
        || keys.has(item.idempotencyKey)) return false;
      keys.add(item.idempotencyKey);
      return true;
    }).slice(-SMS_QUEUE_LIMIT);
    return {
      owner, items,
      lastImportAt: Number.isSafeInteger(stored.lastImportAt) ? stored.lastImportAt : null,
      authError: stored.authError === 401 || stored.authError === 403 ? stored.authError : null,
    };
  } catch {
    return empty;
  }
}

export function createSmsImporter(deps: SmsImportDeps) {
  let tail: Promise<unknown> = Promise.resolve();
  let generation = 0;
  let status: SmsImportStatus = EMPTY_STATUS;
  const listeners = new Set<() => void>();

  function publish(state?: QueueState) {
    status = state ? { pending: state.items.length, lastImportAt: state.lastImportAt, authError: state.authError } : EMPTY_STATUS;
    listeners.forEach((listener) => listener());
  }

  function serial<T>(work: () => Promise<T>): Promise<T> {
    const result = tail.then(work);
    tail = result.catch(() => undefined);
    return result;
  }

  function schedule(incoming?: unknown, upload = true) {
    const submitted = generation;
    const deadline = deps.now() + DRAIN_BUDGET_MS;
    return serial(() => submitted === generation
      ? run(isIncomingSms(incoming) ? incoming : undefined, upload, deadline)
      : Promise.resolve());
  }

  async function save(state: QueueState, run: number) {
    if (run !== generation) return;
    await deps.writeState(JSON.stringify(state));
    if (run === generation) publish(state);
  }

  async function run(incoming: IncomingSms | undefined, upload: boolean, deadline: number) {
    const run = generation;
    const credentials = await deps.readCredentials();
    if (run !== generation) return;
    if (!credentials) {
      await deps.removeState();
      publish();
      return;
    }
    const state = readQueue(await deps.readState(), credentials.owner, deps.now());
    const enabled = await deps.canImport(credentials);
    if (run !== generation) return;
    if (enabled && incoming && !state.authError && !state.items.some((item) => item.idempotencyKey === incoming.idempotencyKey)) {
      state.items.push({
        sender: incoming.sender, body: incoming.body, receivedAt: incoming.receivedAt,
        idempotencyKey: incoming.idempotencyKey, enqueuedAt: deps.now(),
      });
      state.items = state.items.slice(-SMS_QUEUE_LIMIT);
    }
    // Persist before sending. A killed process retries the UUID after an uncertain HTTP result.
    await save(state, run);
    if (!upload || !enabled || state.authError) return;
    while (state.items.length && deps.now() < deadline && run === generation) {
      const current = await deps.readCredentials();
      if (current?.owner !== credentials.owner || !(await deps.canImport(current)) || run !== generation) return;
      const item = state.items[0];
      let response: number;
      try {
        response = await deps.post(current, {
          data: {
            message: item.body, sender: item.sender, idempotencyKey: item.idempotencyKey,
            timestamp: new Date(item.receivedAt).toISOString(),
          },
          metadata: { storeMessageBody: false },
        });
      } catch {
        debugLog.write('sms.drain.retry', { reason: 'network', pending: state.items.length }, 'warn');
        break;
      }
      if (run !== generation || (await deps.readCredentials())?.owner !== credentials.owner) return;
      if (response >= 500 || response === 408 || response === 429) {
        debugLog.write('sms.drain.retry', { status: response, pending: state.items.length }, 'warn');
        break;
      }
      if (response === 401 || response === 403) {
        // This queue belongs to the rejected session. Do not retain or keep sending its SMS.
        state.items = [];
        state.authError = response;
        debugLog.write('sms.drain.auth_error', { status: response }, 'error');
      } else {
        state.items.shift();
        debugLog.write('sms.drain.ok', { status: response, pending: state.items.length });
        // Created, ignored and duplicate succeed. 422 is terminal but not an import.
        if (response === 200 || response === 201) state.lastImportAt = deps.now();
      }
      await save(state, run);
      if (state.authError) break;
    }
  }

  return {
    handleIncoming: (incoming: unknown) => schedule(incoming),
    drain: () => schedule(),
    refresh: () => schedule(undefined, false),
    clear: () => {
      generation += 1;
      publish();
      return serial(async () => { await deps.removeState(); });
    },
    getSnapshot: () => status,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
