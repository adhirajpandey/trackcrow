import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { ApiError, getJson, postJson, patchJson, deleteJson, subscribeUnauthorized, type Credentials } from './client';
import { fetchTransactions, createTransaction, categorizeTransaction } from './transactions';
import { addRecipientAlias } from './recipients';
import { fetchPeriodSpending } from './dashboard';

const credentials: Credentials = { apiUrl: 'https://example.com', token: 'test-token', method: 'token' };
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('JSON methods send bearer auth without browser credentials and accept a bodyless 204', async () => {
  const requests: RequestInit[] = [];
  globalThis.fetch = async (_url, init) => {
    requests.push(init!);
    return init?.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({ uuid: 'result' });
  };
  await getJson(credentials, '/api/accounts');
  await postJson(credentials, '/api/accounts', { name: 'Bank' });
  await patchJson(credentials, '/api/accounts/id', { name: 'Renamed' });
  assert.equal(await deleteJson(credentials, '/api/accounts/id'), undefined);
  assert.deepEqual(
    requests.map((request) => request.method),
    ['GET', 'POST', 'PATCH', 'DELETE'],
  );
  for (const request of requests) {
    assert.equal(request.credentials, 'omit');
    assert.equal((request.headers as Record<string, string>).Authorization, 'Bearer test-token');
  }
  assert.equal(requests[1].body, JSON.stringify({ name: 'Bank' }));
});

for (const code of ['RULE_RECIPIENT_CONFLICT', 'TRANSACTION_SUGGESTION_CONFLICT']) {
  test(`preserves ${code}, validation issues and conflict details`, async () => {
    globalThis.fetch = async () =>
      Response.json(
        { message: 'Conflict', code, issues: [{ path: ['name'] }], details: { existingRule: { uuid: 'rule' } } },
        { status: 409 },
      );
    await assert.rejects(patchJson(credentials, '/api/rules/id', {}), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 409);
      assert.equal(error.message, 'Conflict');
      assert.equal(error.code, code);
      assert.deepEqual(error.issues, [{ path: ['name'] }]);
      assert.deepEqual(error.details, { existingRule: { uuid: 'rule' } });
      return true;
    });
  });
}

test('401 notifies the app with the rejected session and can unsubscribe', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Unauthorized' }, { status: 401 });
  const rejected: Credentials[] = [];
  const unsubscribe = subscribeUnauthorized((session) => rejected.push(session));
  try {
    await assert.rejects(getJson(credentials, '/api/me'), { status: 401 });
    assert.deepEqual(rejected, [credentials]);
  } finally {
    unsubscribe();
  }
  await assert.rejects(getJson(credentials, '/api/me'), { status: 401 });
  assert.equal(rejected.length, 1);
});

test('403 uses action-neutral wording and tolerates a non-JSON error', async () => {
  globalThis.fetch = async () => new Response('Forbidden', { status: 403 });
  await assert.rejects(postJson(credentials, '/api/rules', {}), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 403);
    assert.match(error.message, /permission for this action/);
    assert.doesNotMatch(error.message, /transactions:read/);
    return true;
  });
});

test('caller cancellation remains an abort rather than a connection error', async () => {
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.signal?.aborted, true);
    throw new DOMException('Aborted', 'AbortError');
  };
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(getJson(credentials, '/api/me', controller.signal), { name: 'AbortError' });
});

test('read wrappers encode repeated filters and exact dashboard date boundaries', async () => {
  const urls: string[] = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return Response.json({});
  };
  await fetchTransactions(credentials, {
    q: 'food & travel',
    category: ['one', 'two'],
    classificationSource: ['RULE', 'MANUAL'],
    page: 2,
  });
  const query = new URL(urls[0]).searchParams;
  assert.deepEqual(query.getAll('category'), ['one', 'two']);
  assert.deepEqual(query.getAll('classificationSource'), ['RULE', 'MANUAL']);
  assert.equal(query.get('q'), 'food & travel');
  const range = { startDate: new Date('2026-09-01T00:00:00Z'), endDate: new Date('2026-09-30T23:59:59Z') };
  await fetchPeriodSpending(credentials, range, 'day');
  assert.equal(new URL(urls[1]).searchParams.get('startDate'), range.startDate.toISOString());
  assert.equal(new URL(urls[1]).searchParams.get('granularity'), 'day');
});

test('mutations use individual existing endpoints and never retry an uncertain creation', async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return Response.json({ uuid: 'result' });
  };
  await categorizeTransaction(credentials, 'txn', { categoryUuid: 'food', subcategoryUuid: null });
  await addRecipientAlias(credentials, 'recipient', { value: 'merchant@upi', transfer: true });
  assert.equal(requests[0].url, 'https://example.com/api/transactions/txn/category');
  assert.equal(requests[0].init?.method, 'PATCH');
  assert.equal(requests[1].url, 'https://example.com/api/recipients/recipient/aliases');
  assert.equal(requests[1].init?.method, 'POST');
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error('Network lost after sending');
  };
  await assert.rejects(
    createTransaction(credentials, {
      amount: 120,
      recipientUuid: 'recipient',
      type: 'UPI',
      timestamp: '2026-09-01T00:00:00Z',
    }),
    { status: null },
  );
  assert.equal(calls, 1);
});
