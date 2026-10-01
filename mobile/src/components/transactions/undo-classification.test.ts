import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ApiError, type Credentials } from '../../lib/api/client';
import { undoClassification } from './undo-classification';

const credentials: Credentials = { apiUrl: 'https://example.com', token: 'test-token', method: 'token' };
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

for (const classification of [
  { categoryUuid: null, subcategoryUuid: null },
  { categoryUuid: 'previous-category', subcategoryUuid: 'previous-subcategory' },
]) {
  test(`Undo restores ${classification.categoryUuid ?? 'uncategorized'} before closing the prompt and refreshing`, async () => {
    const events: string[] = [];
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://example.com/api/transactions/transaction-id/category');
      assert.equal(init?.method, 'PATCH');
      assert.deepEqual(JSON.parse(String(init?.body)), classification);
      events.push('restored');
      return Response.json({ uuid: 'transaction-id', ...classification });
    };
    await undoClassification({
      credentials,
      transaction: { uuid: 'transaction-id', ...classification },
      onRestored: () => events.push('prompt-closed'),
      onError: () => assert.fail('Successful Undo must not report an error'),
      invalidate: async () => {
        events.push('refreshed');
      },
    });
    assert.deepEqual(events, ['restored', 'prompt-closed', 'refreshed']);
  });
}

test('failed Undo exposes the server error, retains the prompt, and refreshes the ledger', async () => {
  const errors: unknown[] = [];
  let promptClosed = false;
  let refreshCount = 0;
  globalThis.fetch = async () => Response.json({ message: 'Category was removed.' }, { status: 409 });
  await undoClassification({
    credentials,
    transaction: { uuid: 'transaction-id', categoryUuid: 'removed-category', subcategoryUuid: null },
    onRestored: () => {
      promptClosed = true;
    },
    onError: (error) => errors.push(error),
    invalidate: async () => {
      refreshCount += 1;
    },
  });
  assert.equal(promptClosed, false);
  assert.equal(refreshCount, 1);
  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof ApiError);
  assert.equal(errors[0].message, 'Category was removed.');
});
