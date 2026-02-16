import { runTransactionSearch } from '@/app/crow-bot/tools/transaction-search';
import { validateSession } from '@/common/server';

jest.mock('@/common/server', () => ({
  validateSession: jest.fn(),
}));

const validateSessionMock = validateSession as jest.Mock;

describe('runTransactionSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('returns relative url when NEXT_PUBLIC_APP_URL is missing', async () => {
    validateSessionMock.mockResolvedValueOnce({ success: true, userUuid: 'u1' });

    const result = await runTransactionSearch({
      recipient: 'store',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T23:59:59.999Z',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.searchUrl.startsWith('/transactions?')).toBe(true);
    }
  });

  it('returns unauthorized failure when session is invalid', async () => {
    validateSessionMock.mockResolvedValueOnce({ success: false, error: 'Unauthorized' });

    const result = await runTransactionSearch({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('UNAUTHORIZED');
    }
  });
});
