import assert from 'node:assert/strict';
import { test } from 'node:test';
import { debugLog } from './debug-log';
import { createSmsImporter, SMS_QUEUE_LIMIT, SMS_QUEUE_TTL_MS, type IncomingSms, type SmsCredentials, type SmsImportPayload } from './sms-import';

const NOW = Date.UTC(2026, 8, 30, 12);
function message(n = 1): IncomingSms {
  return { sender: 'AD-HDFCBK', body: 'Synthetic debit message', receivedAt: NOW - 1000,
    idempotencyKey: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}` };
}

function fixture() {
  let stored: string | null = null;
  let credentials: SmsCredentials | null = { apiUrl: 'https://test.invalid', token: 'private-token', owner: 'session-a' };
  let enabled = true;
  let now = NOW;
  let post: (payload: SmsImportPayload) => Promise<number> = async () => 201;
  const requests: SmsImportPayload[] = [];
  const writes: string[] = [];
  const importer = createSmsImporter({
    readCredentials: async () => credentials,
    canImport: async () => enabled,
    readState: async () => stored,
    writeState: async (value) => { writes.push(value); stored = value; },
    removeState: async () => { stored = null; },
    now: () => now,
    post: async (_, payload) => {
      assert.ok(stored?.includes(payload.data.idempotencyKey), 'must persist the key before sending');
      requests.push(payload);
      return post(payload);
    },
  });
  return {
    importer, requests, writes,
    get stored() { return stored; },
    setStored(value: string | null) { stored = value; },
    setCredentials(value: SmsCredentials | null) { credentials = value; },
    setEnabled(value: boolean) { enabled = value; },
    setPost(value: typeof post) { post = value; },
    setNow(value: number) { now = value; },
  };
}

test('posts the new API contract with SMS time and body storage disabled', async () => {
  const f = fixture();
  await f.importer.handleIncoming(message());
  assert.deepEqual(f.requests, [{ data: {
    message: message().body, sender: 'AD-HDFCBK', idempotencyKey: message().idempotencyKey,
    timestamp: new Date(message().receivedAt).toISOString(),
  }, metadata: { storeMessageBody: false } }]);
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.importer.getSnapshot().lastImportAt, NOW);
  assert.equal(f.stored?.includes('private-token'), false);
  assert.equal(f.stored?.includes(message().body), false);
});

for (const [name, response] of [['created', 201], ['ignored', 201], ['duplicate', 200], ['unparseable', 422], ['invalid payload', 400]] as const) {
  test(`removes a ${name} response from the queue`, async () => {
    const f = fixture();
    f.setPost(async () => response);
    await f.importer.handleIncoming(message());
    assert.equal(f.importer.getSnapshot().pending, 0);
    assert.equal(f.stored?.includes(message().body), false);
    if (response >= 400) assert.equal(f.importer.getSnapshot().lastImportAt, null);
  });
}

for (const response of [500, 503, 429, 408]) {
  test(`keeps the same key after HTTP ${response} and drains it on retry`, async () => {
    const f = fixture();
    f.setPost(async () => response);
    await f.importer.handleIncoming(message());
    assert.equal(f.importer.getSnapshot().pending, 1);
    f.setPost(async () => 201);
    await f.importer.drain();
    assert.equal(f.importer.getSnapshot().pending, 0);
    assert.deepEqual(f.requests[1], f.requests[0]);
  });
}

test('retains an offline message and drains older items on the next headless run', async () => {
  const f = fixture();
  f.setPost(async () => { throw new Error('offline'); });
  await f.importer.handleIncoming(message());
  assert.equal(f.importer.getSnapshot().pending, 1);
  f.setPost(async () => 201);
  await f.importer.handleIncoming(message(2));
  assert.deepEqual(f.requests.map((request) => request.data.idempotencyKey), [message().idempotencyKey, message().idempotencyKey, message(2).idempotencyKey]);
  assert.equal(f.importer.getSnapshot().pending, 0);
});

test('bounds an offline queue to the newest 200 messages', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  for (let n = 1; n <= SMS_QUEUE_LIMIT + 3; n++) await f.importer.handleIncoming(message(n));
  assert.equal(f.importer.getSnapshot().pending, SMS_QUEUE_LIMIT);
  const items = JSON.parse(f.stored!).items;
  assert.equal(items[0].idempotencyKey, message(4).idempotencyKey);
  assert.equal(items.at(-1).idempotencyKey, message(203).idempotencyKey);
});

test('expires pending text at seven days without uploading it', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  f.setNow(NOW + SMS_QUEUE_TTL_MS);
  await f.importer.drain();
  assert.equal(f.requests.length, 1);
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.stored?.includes(message().body), false);
});

for (const response of [401, 403] as const) {
  test(`HTTP ${response} drops text and records sign-in failure until credentials change`, async () => {
    const f = fixture();
    f.setPost(async () => response);
    await f.importer.handleIncoming(message());
    assert.equal(f.importer.getSnapshot().authError, response);
    assert.equal(f.importer.getSnapshot().pending, 0);
    await f.importer.handleIncoming(message(2));
    assert.equal(f.requests.length, 1);
    assert.equal(f.stored?.includes(message().body), false);
    f.setCredentials({ apiUrl: 'https://test.invalid', token: 'new-token', owner: 'session-b' });
    f.setPost(async () => 201);
    await f.importer.handleIncoming(message(3));
    assert.equal(f.importer.getSnapshot().authError, null);
    assert.equal(f.requests.length, 2);
  });
}

test('drops incoming and persisted messages when signed out', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  f.setCredentials(null);
  await f.importer.handleIncoming(message(2));
  assert.equal(f.requests.length, 1);
  assert.equal(f.stored, null);
  assert.equal(f.importer.getSnapshot().pending, 0);
});

test('never sends old pending messages with another session', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  f.setCredentials({ apiUrl: 'https://other.invalid', token: 'other-token', owner: 'other-user' });
  await f.importer.drain();
  assert.equal(f.requests.length, 1);
  assert.equal(f.importer.getSnapshot().pending, 0);
});

test('concurrent headless calls preserve both messages without lost queue writes', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await Promise.all([f.importer.handleIncoming(message()), f.importer.handleIncoming(message(2))]);
  assert.equal(f.importer.getSnapshot().pending, 2);
  assert.equal(JSON.parse(f.stored!).items.length, 2);
});

test('redelivered arrival key occupies only one pending slot', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  await f.importer.handleIncoming(message());
  assert.equal(f.importer.getSnapshot().pending, 1);
});

test('sign-out prevents in-flight results and previously scheduled messages from restoring text', async () => {
  const f = fixture();
  let finish!: (response: number) => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  f.setPost(async () => { started(); return new Promise<number>((resolve) => { finish = resolve; }); });
  const first = f.importer.handleIncoming(message());
  await ready;
  const queued = f.importer.handleIncoming(message(2));
  f.setCredentials(null);
  const clear = f.importer.clear();
  finish(503);
  await Promise.all([first, queued, clear]);
  assert.equal(f.stored, null);
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.requests.length, 1);
});

test('bounds a drain to the headless time budget and leaves the rest durable', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  await f.importer.handleIncoming(message(2));
  await f.importer.handleIncoming(message(3));
  let count = 0;
  f.setPost(async () => { count++; f.setNow(NOW + count * 25_000); return 201; });
  await f.importer.drain();
  assert.equal(count, 2);
  assert.equal(f.importer.getSnapshot().pending, 1);
});

test('corrupt queue data and invalid task inputs never reach the server', async () => {
  const f = fixture();
  f.setStored('{broken');
  await f.importer.handleIncoming({ ...message(), idempotencyKey: 'invalid' });
  await f.importer.handleIncoming({ ...message(), receivedAt: NaN });
  assert.equal(f.requests.length, 0);
  assert.equal(f.importer.getSnapshot().pending, 0);
});


test('manual mode preserves pending SMS, ignores arrivals, and resumes the same queue', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  const pending = f.stored;
  f.setEnabled(false);
  await f.importer.refresh();
  await f.importer.drain();
  await f.importer.handleIncoming(message(2));
  assert.equal(f.stored, pending);
  assert.equal(f.importer.getSnapshot().pending, 1);
  assert.equal(f.requests.length, 1);
  f.setEnabled(true);
  f.setPost(async () => 201);
  await f.importer.drain();
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.requests[1].data.idempotencyKey, message().idempotencyKey);
});

test('pausing during a drain stops subsequent uploads and preserves the remaining items', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  await f.importer.handleIncoming(message(2));
  const requests = f.requests.length;
  f.setPost(async () => { f.setEnabled(false); return 201; });
  await f.importer.drain();
  assert.equal(f.requests.length, requests + 1);
  assert.equal(f.importer.getSnapshot().pending, 1);
  assert.equal(JSON.parse(f.stored!).items[0].idempotencyKey, message(2).idempotencyKey);
});

test('paused imports still erase queued text on sign-out and never reuse another session', async () => {
  const f = fixture();
  f.setPost(async () => 503);
  await f.importer.handleIncoming(message());
  f.setEnabled(false);
  f.setCredentials({ apiUrl: 'https://other.invalid', token: 'other-token', owner: 'other-user' });
  await f.importer.refresh();
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.stored?.includes(message().body), false);
  f.setCredentials(null);
  await f.importer.refresh();
  assert.equal(f.stored, null);
  assert.equal(f.requests.length, 1);
});


test('discards new OTP arrivals before any queue persistence or upload', async (t) => {
  const logged = t.mock.method(debugLog, 'write', () => {});
  const f = fixture();
  const sms = { ...message(), body: 'Your OTP is 123456. Do not share this code.' };
  await f.importer.handleIncoming(sms);
  assert.equal(f.requests.length, 0);
  assert.ok(f.writes.every((value) => !value.includes(sms.body) && !value.includes(sms.idempotencyKey)));
  assert.equal(f.importer.getSnapshot().pending, 0);
  assert.equal(f.importer.getSnapshot().lastImportAt, null);
  assert.deepEqual(logged.mock.calls.map((call) => call.arguments), [['sms.filter.discarded']]);
});

test('checks eligibility before recording a local discard', async (t) => {
  const logged = t.mock.method(debugLog, 'write', () => {});
  for (const mode of ['signed-out', 'manual'] as const) {
    const f = fixture();
    if (mode === 'signed-out') f.setCredentials(null);
    else f.setEnabled(false);
    await f.importer.handleIncoming({ ...message(), body: 'Your OTP is 123456' });
    assert.equal(f.requests.length, 0);
    assert.equal(f.importer.getSnapshot().pending, 0);
  }
  assert.equal(logged.mock.calls.length, 0);
});

test('a discarded arrival still drains valid pending messages', async () => {
  const f = fixture();
  f.setPost(async () => { throw new Error('offline'); });
  await f.importer.handleIncoming(message());
  f.setPost(async () => 201);
  const otp = { ...message(2), body: 'Verification code: 123456' };
  await f.importer.handleIncoming(otp);
  assert.deepEqual(f.requests.map((request) => request.data.idempotencyKey), [message().idempotencyKey, message().idempotencyKey]);
  assert.ok(f.writes.every((value) => !value.includes(otp.body) && !value.includes(otp.idempotencyKey)));
  assert.equal(f.importer.getSnapshot().pending, 0);
});

test('nonmatching notices are queued and uploaded without transaction keywords', async () => {
  const f = fixture();
  const sms = { ...message(), body: 'Your monthly statement is ready.' };
  f.setPost(async () => 503);
  await f.importer.handleIncoming(sms);
  assert.equal(f.requests[0].data.message, sms.body);
  assert.equal(f.importer.getSnapshot().pending, 1);
  f.setPost(async () => 201);
  await f.importer.drain();
  assert.deepEqual(f.requests[1], f.requests[0]);
  assert.equal(f.importer.getSnapshot().pending, 0);
});

test('existing queued messages are not filtered by the new-arrival policy', async () => {
  const f = fixture();
  const sms = { ...message(), body: 'Existing OTP message: 123456' };
  f.setStored(JSON.stringify({ owner: 'session-a', items: [{ ...sms, enqueuedAt: NOW }], lastImportAt: null, authError: null }));
  await f.importer.drain();
  assert.equal(f.requests[0].data.message, sms.body);
  assert.equal(f.importer.getSnapshot().pending, 0);
});
