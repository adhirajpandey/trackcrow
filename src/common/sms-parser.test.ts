import { parseTransactionMessage } from './sms-parser';

describe('parseTransactionMessage', () => {
  it('parses Kotak Credit Card UPI merchant format and extracts ref + merchant', () => {
    const message =
      'INR 200 spent on Kotak Credit Card x6387 on 28-FEB-2026 at UPI-600117529647-HAMAN. Avl limit INR 29668.72 Fraud? https://www.kotak.bank.in/KBANKT/querytxn';

    const parsed = parseTransactionMessage(message);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      amount: 200,
      recipient: 'HAMAN',
      recipient_name: 'HAMAN',
      reference: '600117529647',
      type: 'CARD',
      account: 'KOTAK',
    });
  });
});
