import assert from 'node:assert/strict';
import test from 'node:test';
import { canApplyRecipientCategory } from './recipient-category';

test('only applies to entries still uncategorized and linked to the recipient', () => {
  assert.equal(canApplyRecipientCategory({ recipientUuid: 'target', categoryUuid: null }, 'target'), true);
  assert.equal(canApplyRecipientCategory({ recipientUuid: 'moved', categoryUuid: null }, 'target'), false);
  assert.equal(canApplyRecipientCategory({ recipientUuid: 'target', categoryUuid: 'already-filed' }, 'target'), false);
});
