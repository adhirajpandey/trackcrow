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
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

type SessionMock = { user: { uuid: string; email?: string } } | null;

type PrismaTransactionsMock = {
  transaction: {
    findFirst: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
  };
};

const getServerSessionMock = getServerSession as jest.Mock<Promise<SessionMock>>;
const prismaMock = prisma as unknown as PrismaTransactionsMock;

function mockTxnBounds() {
  prismaMock.transaction.findFirst
    .mockResolvedValueOnce({ timestamp: new Date('2025-01-01T00:00:00.000Z') })
    .mockResolvedValueOnce({ timestamp: new Date('2025-01-31T00:00:00.000Z') });
}

describe('GET /api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns paginated transactions with metadata', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'user-1' } });
    mockTxnBounds();
    prismaMock.transaction.count.mockResolvedValueOnce(1);
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      {
        user_uuid: 'user-1',
        id: 11,
        timestamp: new Date('2025-01-20T08:00:00.000Z'),
        recipient: 'Store A',
        amount: 450.55,
        type: 'UPI',
        location: null,
        recipient_name: null,
        remarks: null,
        Category: { name: 'Food' },
        Subcategory: { name: 'Dining' },
      },
    ]);

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      transactions: Array<{ recipient: string; category: string | null }>;
    }>(response);

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.hasNext).toBe(false);
    expect(body.hasPrev).toBe(false);
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0]).toMatchObject({
      recipient: 'Store A',
      category: 'Food',
    });
  });

  it('returns empty page when requested page is out of range', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'user-1' } });
    mockTxnBounds();
    prismaMock.transaction.count.mockResolvedValueOnce(1);

    const response = await GET(
      new Request('http://localhost/api/transactions?page=3&size=1')
    );
    const body = await parseJson<{ transactions: unknown[]; totalPages: number }>(
      response
    );

    expect(response.status).toBe(200);
    expect(body.totalPages).toBe(1);
    expect(body.transactions).toEqual([]);
    expect(prismaMock.transaction.findMany).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected database failure', async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { uuid: 'user-1' } });
    mockTxnBounds();
    prismaMock.transaction.count.mockRejectedValueOnce(new Error('db down'));

    const response = await GET(new Request('http://localhost/api/transactions'));
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(500);
    expect(body.message).toBe('Internal Server Error');
  });
});
