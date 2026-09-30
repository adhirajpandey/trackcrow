import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSmsPermission, type SmsPermission } from './sms-permission';

function fixture() {
  let decision: string | null = null;
  let granted = false;
  let result: SmsPermission = 'denied';
  let prompts = 0;
  const permission = createSmsPermission({
    check: async () => granted,
    readDecision: async () => decision,
    writeDecision: async (value) => { decision = value; },
    request: async () => { prompts++; return result; },
  });
  return { permission, get prompts() { return prompts; }, setGranted(value: boolean) { granted = value; }, setResult(value: SmsPermission) { result = value; } };
}

test('automatically requests once and never repeats after denial', async () => {
  const f = fixture();
  await f.permission.request(true);
  await f.permission.request(true);
  assert.equal(f.prompts, 1);
});

test('an explicit Grant can retry a denial', async () => {
  const f = fixture();
  await f.permission.request(true);
  f.setResult('granted');
  assert.equal(await f.permission.request(), 'granted');
  assert.equal(f.prompts, 2);
});

test('permanent denial selects app settings without requesting again', async () => {
  const f = fixture();
  f.setResult('never_ask_again');
  await f.permission.request(true);
  assert.equal(await f.permission.request(), 'never_ask_again');
  assert.equal(f.prompts, 1);
});

test('reads granted permission from Android even after a stored denial', async () => {
  const f = fixture();
  await f.permission.request(true);
  f.setGranted(true);
  assert.equal(await f.permission.check(), 'granted');
  assert.equal(await f.permission.request(true), 'granted');
  assert.equal(f.prompts, 1);
});

test('concurrent startup and sign-in checks share one permission prompt', async () => {
  const f = fixture();
  await Promise.all([f.permission.request(true), f.permission.request(true)]);
  assert.equal(f.prompts, 1);
});
