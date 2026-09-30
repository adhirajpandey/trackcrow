import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSmsConfigSync, SMS_CONFIG_REFRESH_MS, validateSmsConfig, type SmsConfig } from './sms-config';

const config: SmsConfig = { schemaVersion: 1, configVersion: '1', banks: [{ id: 'KOTAK', name: 'Kotak', senderHeaders: ['KOTAKB'] }] };
function fixture(cache: string | null = null) {
  let stored = cache;
  let time = 1000;
  let response = new Response(JSON.stringify(config), { headers: { ETag: '"v1"' } });
  let nativeAccepted = true;
  const native: SmsConfig[] = [];
  const requests: (string | null)[] = [];
  const sync = createSmsConfigSync({
    readCache: async () => stored,
    writeCache: async (value) => { stored = value; },
    setNative: (value) => { if (nativeAccepted) native.push(JSON.parse(value)); return nativeAccepted; },
    fetchConfig: async (etag) => { requests.push(etag); return response; },
    now: () => time,
  });
  return {
    sync, native, requests, get stored() { return stored; },
    respond(value: unknown, status = 200, etag = '"v2"') { response = new Response(status === 304 ? null : JSON.stringify(value), { status, headers: { ETag: etag } }); },
    advance(ms: number) { time += ms; }, rejectNative() { nativeAccepted = false; },
  };
}

test('validates schema, bank metadata, bounded plain headers and duplicate bank IDs', () => {
  assert.equal(validateSmsConfig(config), true);
  for (const header of ['', 'LONGHEADER', 'A.*', 'AD-KOTAKB', ' KOTAKB', 'क']) {
    assert.equal(validateSmsConfig({ ...config, banks: [{ ...config.banks[0], senderHeaders: [header] }] }), false);
  }
  for (const value of [null, {}, { ...config, schemaVersion: 2 }, { ...config, configVersion: '' }, { ...config, banks: [] }, { ...config, banks: [config.banks[0], config.banks[0]] }]) {
    assert.equal(validateSmsConfig(value), false);
  }
});

test('fetches on launch, sends ETag on foreground refresh and keeps config on 304', async () => {
  const f = fixture();
  await f.sync.refresh(true);
  assert.deepEqual(f.native, [config]);
  f.respond(null, 304);
  f.advance(SMS_CONFIG_REFRESH_MS);
  await f.sync.refresh();
  assert.deepEqual(f.requests, [null, '"v1"']);
  assert.deepEqual(f.sync.getSnapshot().config, config);
  assert.equal(f.native.length, 1);
});

test('restores cached config before a failed fetch and uses its ETag', async () => {
  const cache = JSON.stringify({ config, etag: '"cached"' });
  const f = fixture(cache);
  f.respond({}, 503);
  await f.sync.refresh(true);
  assert.deepEqual(f.native, [config]);
  assert.deepEqual(f.requests, ['"cached"']);
  assert.equal(f.stored, cache);
});

test('invalid responses never replace a working native or JS config', async () => {
  const f = fixture();
  await f.sync.refresh(true);
  const stored = f.stored;
  f.respond({ ...config, schemaVersion: 999 });
  await f.sync.refresh(true);
  assert.equal(f.native.length, 1);
  assert.equal(f.stored, stored);
  assert.equal(f.sync.getSnapshot().etag, '"v1"');
});

test('broken cache falls back to bundled native behavior until a valid fetch', async () => {
  const f = fixture('{broken');
  f.respond({}, 503);
  await f.sync.refresh(true);
  assert.equal(f.native.length, 0);
  assert.equal(f.sync.getSnapshot().config, null);
  assert.deepEqual(f.requests, [null]);
});

test('foreground checks are throttled, but sign-in forces another fetch', async () => {
  const f = fixture();
  await f.sync.refresh(true);
  await f.sync.refresh();
  assert.equal(f.requests.length, 1);
  f.respond(config);
  await f.sync.refresh(true);
  assert.equal(f.requests.length, 2);
});

test('concurrent launch and foreground refreshes share one request', async () => {
  const f = fixture();
  await Promise.all([f.sync.refresh(true), f.sync.refresh(), f.sync.refresh(true)]);
  assert.equal(f.requests.length, 1);
});

test('native rejection never commits new cache or ETag', async () => {
  const f = fixture();
  await f.sync.refresh(true);
  const stored = f.stored;
  f.rejectNative();
  f.respond({ ...config, configVersion: '2' });
  await f.sync.refresh(true);
  assert.equal(f.stored, stored);
  assert.equal(f.sync.getSnapshot().config?.configVersion, '1');
});

test('network and storage exceptions leave native config intact', async () => {
  let native: string | null = null;
  const sync = createSmsConfigSync({
    readCache: async () => JSON.stringify({ config, etag: '"v1"' }),
    writeCache: async () => { throw new Error('storage unavailable'); },
    setNative: (json) => { native = json; return true; },
    fetchConfig: async () => { throw new Error('offline'); }, now: () => 1000,
  });
  await sync.refresh(true);
  assert.deepEqual(JSON.parse(native!), config);
  assert.deepEqual(sync.getSnapshot().config, config);
});
