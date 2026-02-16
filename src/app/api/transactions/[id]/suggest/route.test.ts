import { GET } from './route';
import { parseJson } from '@/test/api-test-helpers';
import { requireUserSession } from '@/services/auth/guard-service';
import { suggestCategory } from '@/services/transactions/transaction-service';

jest.mock('@/services/auth/guard-service', () => ({
  requireUserSession: jest.fn(),
}));

jest.mock('@/services/transactions/transaction-service', () => ({
  suggestCategory: jest.fn(),
}));

const requireUserSessionMock = requireUserSession as jest.Mock;
const suggestCategoryMock = suggestCategory as jest.Mock;

describe('GET /api/transactions/[id]/suggest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is unauthorized', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: false, error: 'UNAUTHORIZED' });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '1' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid transaction id', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    suggestCategoryMock.mockResolvedValueOnce({ ok: false, error: 'VALIDATION_ERROR' });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: 'abc' },
    });

    const body = await parseJson<{ error: string }>(response);
    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid transaction ID');
  });

  it('returns 404 when transaction is not found', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    suggestCategoryMock.mockResolvedValueOnce({ ok: false, error: 'NOT_FOUND' });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{ error: string }>(response);
    expect(response.status).toBe(404);
    expect(body.error).toBe('Transaction not found');
  });

  it('returns suggestions from service', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    suggestCategoryMock.mockResolvedValueOnce({
      ok: true,
      data: {
        suggestedCategory: 'Food',
        suggestedSubCategory: 'Lunch',
      },
    });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{
      suggestedCategory: string | null;
      suggestedSubCategory: string | null;
    }>(response);

    expect(response.status).toBe(200);
    expect(body.suggestedCategory).toBe('Food');
    expect(body.suggestedSubCategory).toBe('Lunch');
  });

  it('returns 500 on service failure', async () => {
    requireUserSessionMock.mockResolvedValueOnce({ ok: true, data: { userUuid: 'u1' } });
    suggestCategoryMock.mockResolvedValueOnce({ ok: false, error: 'INTERNAL_ERROR' });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
});
