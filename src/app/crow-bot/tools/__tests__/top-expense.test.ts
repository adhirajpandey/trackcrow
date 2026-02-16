import { runTopExpense } from '@/app/crow-bot/tools/top-expense';
import { validateSession } from '@/common/server';
import prisma from '@/lib/prisma';

jest.mock('@/common/server', () => ({
  validateSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    category: {
      findFirst: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
  },
}));

const validateSessionMock = validateSession as jest.Mock;
const prismaMock = prisma as unknown as {
  category: { findFirst: jest.Mock };
  transaction: { findMany: jest.Mock };
};

describe('runTopExpense', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns non-empty message for default mode', async () => {
    validateSessionMock.mockResolvedValueOnce({ success: true, userUuid: 'u1' });
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      {
        id: 1,
        amount: 500,
        remarks: 'x',
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
        Category: { name: 'Food' },
        Subcategory: { name: 'Lunch' },
      },
    ]);

    const result = await runTopExpense({});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.message.length).toBeGreaterThan(0);
    }
  });

  it('returns NOT_FOUND when category does not exist', async () => {
    validateSessionMock.mockResolvedValueOnce({ success: true, userUuid: 'u1' });
    prismaMock.category.findFirst.mockResolvedValueOnce(null);

    const result = await runTopExpense({ category: 'Unknown' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('NOT_FOUND');
    }
  });
});
