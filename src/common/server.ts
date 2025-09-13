import prisma from "@/lib/prisma";
import { userReadSchema, type Transaction } from "@/common/schemas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Fetches all transactions for a user, ordered by latest first, and serializes
 * Prisma-specific types (Decimal, Date) into plain JSON-compatible values.
 * The `timestamp` field is provided as an ISO string for consistency across UI.
 */
export async function getUserTransactions(
  userUuid: string,
  includeCategoryAndSubcategory: boolean = false,
  startDate?: Date,
  endDate?: Date,
): Promise<Transaction[]> {
  const whereClause: any = {
    user_uuid: userUuid,
  };

  if (startDate && endDate) {
    whereClause.timestamp = {
      gte: startDate,
      lt: endDate,
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
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

/**
 * Validates user session and returns user UUID if valid
 * @returns Object with success status and user UUID or error message
 */
export async function validateSession(): Promise<
  | { success: true; userUuid: string }
  | { success: false; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { success: false, error: "Unauthorized" };
  }
  return { success: true, userUuid: session.user.uuid };
}

/**
 * Validates that a transaction exists and belongs to the user
 * @param transactionId - The ID of the transaction to validate
 * @param userUuid - The UUID of the user
 * @returns Object with success status and transaction data or error message
 */
export async function validateTransactionOwnership(
  transactionId: number,
  userUuid: string
): Promise<
  | { success: true; transaction: any }
  | { success: false; error: string }
> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, user_uuid: userUuid }
  });
  
  if (!transaction) {
    return { success: false, error: "Transaction not found" };
  }
  
  return { success: true, transaction };
}