import { GET } from './route';
import { parseJson } from '@/test/api-test-helpers';
import { requireUserSession } from '@/services/auth/guard-service';
import { listTransactions } from '@/services/transactions/transaction-service';

jest.mock('@/services/auth/guard-service', () => ({
  requireUserSession: jest.fn(),
}));

jest.mock('@/services/transactions/transaction-service', () => ({
  listTransactions: jest.fn(),
}));

const requireUserSessionMock = requireUserSession as jest.Mock;
const listTransactionsMock = listTransactions as jest.Mock;

describe('GET /api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: false, error: 'UNAUTHORIZED' });

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 with service payload', async () => {
    requireUserSessionMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: 'user-1' },
    });

    listTransactionsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        transactions: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        firstTxnDate: null,
        lastTxnDate: null,
      },
    });

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{ pageSize: number; transactions: unknown[] }>(response);

    expect(response.status).toBe(200);
    expect(body.pageSize).toBe(20);
    expect(body.transactions).toEqual([]);
    expect(listTransactionsMock).toHaveBeenCalledTimes(1);
  });

  it('returns 500 on service failure', async () => {
    requireUserSessionMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: 'user-1' },
    });
    listTransactionsMock.mockResolvedValueOnce({ ok: false, error: 'INTERNAL_ERROR' });

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
});
