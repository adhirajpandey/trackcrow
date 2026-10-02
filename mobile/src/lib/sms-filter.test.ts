import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldDiscardSms } from './sms-filter';

for (const phrase of [
  'otp',
  'one time password',
  'one-time password',
  'verification code',
  'security code',
  'authentication code',
  'do not share otp',
  'do not share this code',
  'never share otp',
  'valid for',
  'expires in',
  'use this otp',
  'enter otp',
]) {
  test(`discards messages containing "${phrase}" anywhere, regardless of case`, () => {
    for (const text of [phrase, phrase.toUpperCase(), phrase.replace(/(^| )./g, (s) => s.toUpperCase())]) {
      assert.equal(shouldDiscardSms(`Bank notice: ${text} 123456. End of notice.`), true);
    }
  });
}

test('discards transaction alerts containing a listed phrase without an exception', () => {
  assert.equal(shouldDiscardSms('Sent Rs.100.00 to merchant. Do not share OTP.'), true);
  assert.equal(shouldDiscardSms('Rs.250 spent via a debit card. Offer valid for today.'), true);
});

test('allows every nonmatching message without requiring transaction wording', () => {
  for (const body of ['', 'Your monthly statement is ready.', 'Sent Rs.100.00 to merchant.', 'Bank service notice']) {
    assert.equal(shouldDiscardSms(body), false);
  }
});
