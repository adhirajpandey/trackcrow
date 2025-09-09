import prisma from "@/lib/prisma";
import { userReadSchema, type Transaction } from "@/common/schemas";

/**
 * Fetches all transactions for a user, ordered by latest first, and serializes
 * Prisma-specific types (Decimal, Date) into plain JSON-compatible values.
 * The `timestamp` field is provided as an ISO string for consistency across UI.
 */
export async function getUserTransactions(
  userUuid: string,
  includeCategoryAndSubcategory: boolean = false,
): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      user_uuid: userUuid,
    },
    orderBy: {
      timestamp: "desc",
    },
    include: {
      Category: includeCategoryAndSubcategory,
      Subcategory: includeCategoryAndSubcategory,
    },
  });

  return transactions.map((txn) => ({
    ...txn,
    amount: txn.amount.toNumber(), // Convert Decimal to number
    timestamp: txn.timestamp.toISOString(), // Convert Date to ISO string
    createdAt: txn.createdAt.toISOString(),
    updatedAt: txn.updatedAt.toISOString(),
    category: txn.Category?.name || null,
    subcategory: txn.Subcategory?.name || null,
  }));
}

export async function getUserDetails(userUuid: string) {
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
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!dbUser) {
    return null;
  }

  const payload = {
    uuid: dbUser.uuid,
    id: dbUser.id,
    categories: dbUser.Category.map((c) => ({
      name: c.name,
      subcategories: c.Subcategory.map((s) => s.name),
    })),
  };

  return userReadSchema.parse(payload);
}