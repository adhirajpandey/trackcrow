const discardPhrases = [
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
] as const;

/** Fixed local policy for new arrivals; transaction wording does not override a match. */
export function shouldDiscardSms(body: string): boolean {
  const normalized = body.toLowerCase();
  return discardPhrases.some((phrase) => normalized.includes(phrase));
}
