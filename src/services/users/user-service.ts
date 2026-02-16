import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { type Transaction, userReadSchema } from '@/common/schemas';
import { fail, ok, type ServiceResult } from '@/services/shared/result';

export async function getUserTransactionsService(
  userUuid: string,
  includeCategoryAndSubcategory: boolean = false,
  startDate?: Date,
  endDate?: Date
): Promise<ServiceResult<Transaction[], 'INTERNAL_ERROR'>> {
  const whereClause: any = {
    user_uuid: userUuid,
  };

  if (startDate && endDate) {
    whereClause.timestamp = {
      gte: startDate,
      lt: endDate,
    };
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        Category: includeCategoryAndSubcategory,
        Subcategory: includeCategoryAndSubcategory,
      },
    });

    const mapped = transactions.map((txn: any) => ({
      ...txn,
      amount: txn.amount.toNumber(),
      timestamp: txn.timestamp.toISOString(),
      createdAt: txn.createdAt.toISOString(),
      updatedAt: txn.updatedAt.toISOString(),
      category: txn.Category?.name || null,
      subcategory: txn.Subcategory?.name || null,
    }));

    return ok(mapped);
  } catch (error) {
    logger.error('getUserTransactionsService - Database error', error as Error, {
      userUuid,
      includeCategoryAndSubcategory,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function getUserDetailsService(
  userUuid: string
): Promise<
  ServiceResult<
    { uuid: string; id: number; categories: { name: string; subcategories: string[] }[] } | null,
    'INTERNAL_ERROR'
  >
> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { uuid: userUuid },
      select: {
        uuid: true,
        id: true,
        Category: {
          select: {
            name: true,
            Subcategory: {
              select: { name: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!dbUser) {
      return ok(null);
    }

    const payload = {
      uuid: dbUser.uuid,
      id: dbUser.id,
      categories: dbUser.Category.map((c: any) => ({
        name: c.name,
        subcategories: c.Subcategory.map((s: any) => s.name),
      })),
    };

    return ok(userReadSchema.parse(payload));
  } catch (error) {
    logger.error('getUserDetailsService - Database error', error as Error, {
      userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function getUserCategoriesService(
  userUuid: string
): Promise<
  ServiceResult<{ name: string; subcategories: string[] }[], 'INTERNAL_ERROR'>
> {
  try {
    const categories = await prisma.category.findMany({
      where: { user_uuid: userUuid },
      include: { Subcategory: true },
      orderBy: { name: 'asc' },
    });

    return ok(
      categories.map((c: any) => ({
        name: c.name,
        subcategories: c.Subcategory.map((s: any) => s.name),
      }))
    );
  } catch (error) {
    logger.error('getUserCategoriesService - Database error', error as Error, {
      userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}
