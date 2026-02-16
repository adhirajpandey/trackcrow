import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { GET } from './route';
import { parseJson } from '@/test/api-test-helpers';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    transaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

type SessionMock = { user: { uuid: string } } | null;

type PrismaSuggestMock = {
  transaction: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
};

const getServerSessionMock = getServerSession as jest.Mock<Promise<SessionMock>>;
const prismaMock = prisma as unknown as PrismaSuggestMock;

describe('GET /api/transactions/[id]/suggest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is unauthorized', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '1' },
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid transaction id', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'u1' } });

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: 'abc' },
    });

    const body = await parseJson<{ error: string }>(response);
    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid transaction ID');
  });

  it('returns 404 when transaction is not found', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'u1' } });
    prismaMock.transaction.findUnique.mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{ error: string }>(response);
    expect(response.status).toBe(404);
    expect(body.error).toBe('Transaction not found');
  });

  it('returns null suggestions when no similar transactions exist', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'u1' } });
    prismaMock.transaction.findUnique.mockResolvedValueOnce({ recipient: 'vendor@upi' });
    prismaMock.transaction.findMany.mockResolvedValueOnce([]);

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{
      suggestedCategory: string | null;
      suggestedSubCategory: string | null;
    }>(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      suggestedCategory: null,
      suggestedSubCategory: null,
    });
  });

  it('returns most frequent category and subcategory suggestions', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'u1' } });
    prismaMock.transaction.findUnique.mockResolvedValueOnce({ recipient: 'vendor@upi' });
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      { Category: { name: 'Food' }, Subcategory: { name: 'Lunch' } },
      { Category: { name: 'Food' }, Subcategory: { name: 'Lunch' } },
      { Category: { name: 'Shopping' }, Subcategory: { name: 'Groceries' } },
    ]);

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

  it('returns 500 on unexpected errors', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'u1' } });
    prismaMock.transaction.findUnique.mockRejectedValueOnce(new Error('db error'));

    const response = await GET(new Request('http://localhost') as any, {
      params: { id: '4' },
    });

    const body = await parseJson<{ message: string }>(response);
    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
});
