import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDebugLog, debugPath, redactDebugAttrs } from './debug-log';
test('drops secrets, financial values, unknown keys and arbitrary strings at write time', async () => {
  const attrs = {
    status: 401,
    pending: 2,
    signedIn: true,
    permission: 'denied',
    token: 'secret',
    sms: 'bank text',
    amount: 200,
    email: 'a@b.com',
    recipient: 'Alice',
    upi: 'a@upi',
    reference: '123',
    reason: 'secret',
    path: '/api/transactions/private',
  };
  assert.deepEqual(redactDebugAttrs(attrs), {
    status: 401,
    pending: 2,
    signedIn: true,
    permission: 'denied',
  });
  let saved = '';
  const log = createDebugLog(async () => ({
    getItem: async () => null,
    setItem: async (_k, v) => {
      saved = v;
    },
  }));
  log.write('api.error', attrs);
  attrs.token = 'changed';
  await log.read();
  assert.equal(saved.includes('secret'), false);
  assert.equal(saved.includes('Alice'), false);
  assert.equal(debugPath('/api/transactions/private?token=secret'), '/api/transactions/:id');
  assert.equal(debugPath('/unknown/private'), undefined);
});
test('keeps 500 entries across persistence and ignores unknown events', async () => {
  let saved: string | null = null;
  const store = async () => ({
    getItem: async () => saved,
    setItem: async (_k: string, v: string) => {
      saved = v;
    },
  });
  const log = createDebugLog(store, () => 123);
  for (let i = 0; i < 510; i++) log.write('sms.drain.ok', { pending: i % 200 });
  log.write('secret event');
  assert.equal((await log.read()).length, 500);
  assert.equal((await createDebugLog(store).read()).length, 500);
});
test('storage failures never escape write or read', async () => {
  const log = createDebugLog(async () => {
    throw new Error('unavailable');
  });
  assert.doesNotThrow(() => log.write('sms.drain.retry'));
  assert.equal((await log.read()).length, 1);
});

test('rehydration redacts old attributes and excludes invalid stored events', async () => {
  const saved = JSON.stringify([
    {
      ts: 1,
      level: 'info',
      event: 'api.error',
      attrs: { status: 403, token: 'secret', amount: 900 },
      sms: 'secret text',
    },
    { ts: 2, level: 'info', event: 'secret text' },
  ]);
  const log = createDebugLog(async () => ({ getItem: async () => saved, setItem: async () => {} }));
  assert.deepEqual(await log.read(), [{ ts: 1, level: 'info', event: 'api.error', attrs: { status: 403 } }]);
  assert.deepEqual(
    redactDebugAttrs({
      status: NaN,
      pending: Infinity,
      signedIn: 'secret',
      path: ['secret'],
      step: 'secret',
      toString: 'secret',
    }),
    undefined,
  );
});


test('a failed initial read preserves saved history and retries before persisting', async () => {
  const history = JSON.stringify([{ ts: 1, level: 'info', event: 'sms.drain.ok' }]);
  let saved = history;
  let failing = true;
  let writes = 0;
  const log = createDebugLog(async () => ({
    getItem: async () => {
      if (failing) throw new Error('temporary read failure');
      return saved;
    },
    setItem: async (_key, value) => { writes++; saved = value; },
  }), () => 2);
  log.write('sms.drain.retry');
  assert.equal((await log.read()).length, 1);
  assert.equal(saved, history);
  assert.equal(writes, 0);
  failing = false;
  log.write('permission.changed', { permission: 'denied' });
  assert.deepEqual((await log.read()).map((entry) => entry.event), [
    'sms.drain.ok', 'sms.drain.retry', 'permission.changed',
  ]);
  assert.equal(JSON.parse(saved).length, 3);
  assert.equal(writes, 1);
});
