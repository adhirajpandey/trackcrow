import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSmsPermission, type SmsPermission } from './sms-permission';
import { canImportSms, canImportStoredSms, createOnboarding, shouldSkipOnboarding } from './onboarding';
test('completion and manual mode are isolated per normalized server URL', async () => {
  const data = new Map<string, string>();
  const setup = createOnboarding(async () => ({
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => {
      data.set(k, v);
    },
    removeItem: async (k) => {
      data.delete(k);
    },
  }));
  await setup.save('https://example.com/', { complete: true, mode: 'manual' });
  assert.deepEqual(await setup.read('https://example.com'), { complete: true, mode: 'manual' });
  assert.equal(await setup.read('https://other.example.com'), null);
  await setup.clear('https://example.com');
  assert.equal(shouldSkipOnboarding(await setup.read('https://example.com'), true, true, true), false);
});
test('upgrade skips only signed-in users with existing SMS setup; fresh and incomplete setup opens', () => {
  assert.equal(shouldSkipOnboarding(null, true, true, false), true);
  assert.equal(shouldSkipOnboarding(null, true, false, true), true);
  assert.equal(shouldSkipOnboarding(null, true, false, false), false);
  assert.equal(shouldSkipOnboarding(null, false, true, true), false);
  assert.equal(shouldSkipOnboarding({ complete: false, mode: 'sms' }, true, true, true), false);
  assert.equal(shouldSkipOnboarding({ complete: true, mode: 'manual' }, false, false, false), true);
});

test('manual and incomplete mode cannot import despite an existing Android grant', () => {
  assert.equal(canImportSms('manual', 'granted'), false);
  assert.equal(canImportSms(null, 'granted'), false);
  assert.equal(canImportSms('sms', 'denied'), false);
  assert.equal(canImportSms('sms', 'never_ask_again'), false);
  assert.equal(canImportSms('sms', 'granted'), true);
});

test('onboarding checks permission without prompting and explicitly retries a blocked request', async () => {
  let decision: string | null = null;
  let prompts = 0;
  let granted = false;
  const permission = createSmsPermission({
    check: async () => granted,
    readDecision: async () => decision,
    writeDecision: async (value) => {
      decision = value;
    },
    request: async (): Promise<SmsPermission> => {
      prompts++;
      return granted ? 'granted' : 'never_ask_again';
    },
  });
  await permission.check();
  assert.equal(prompts, 0);
  await permission.request(false, true);
  assert.equal(await permission.check(), 'never_ask_again');
  await permission.request(false, true);
  assert.equal(prompts, 2);
  granted = true;
  assert.equal(await permission.check(), 'granted');
});


test('only absent setup can use the granted-permission upgrade exception', async () => {
  let raw: string | null = null;
  const setup = createOnboarding(async () => ({
    getItem: async () => raw,
    setItem: async (_key, value) => { raw = value; },
    removeItem: async () => { raw = null; },
  }));
  assert.equal(await setup.read('https://example.com'), null);
  assert.equal(canImportStoredSms(null, 'granted'), true);
  assert.equal(canImportStoredSms(null, 'denied'), false);
  for (const invalid of ['', '{broken', 'null', '{}', '{"complete":true,"mode":"invalid"}']) {
    raw = invalid;
    const state = await setup.read('https://example.com');
    assert.deepEqual(state, { complete: false, mode: 'manual' });
    assert.equal(shouldSkipOnboarding(state, true, true, true), false);
    assert.equal(canImportStoredSms(state, 'granted'), false);
  }
  assert.equal(canImportStoredSms({ complete: true, mode: 'sms' }, 'granted'), true);
  assert.equal(canImportStoredSms({ complete: true, mode: 'sms' }, 'denied'), false);
  assert.equal(canImportStoredSms({ complete: false, mode: 'manual' }, 'granted'), false);
});
