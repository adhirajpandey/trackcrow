import { transactionRead, type Transaction } from "@/common/schemas";
import prisma from "@/lib/prisma";

/**
 * Server-only: Fetch all transactions for a user and serialize Prisma types.
 */
export async function getUserTransactions(uuid: string): Promise<Transaction[]> {
  const txns = await prisma.transaction.findMany({
    where: { user_uuid: uuid },
    orderBy: { ist_datetime: "desc" },
  });

  const serialized = txns.map((t: any) => {
    const amount =
      typeof t.amount?.toNumber === "function" ? t.amount.toNumber() : Number(t.amount);
    const createdAtISO = t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt);
    const updatedAtISO = t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt);
    const istISO = t.ist_datetime instanceof Date ? t.ist_datetime.toISOString() : t.ist_datetime ?? null;
    const timestamp = t.ist_datetime instanceof Date
      ? t.ist_datetime.getTime()
      : new Date(t.createdAt).getTime();

    return {
      ...t,
      amount,
      createdAt: createdAtISO,
      updatedAt: updatedAtISO,
      ist_datetime: istISO,
      timestamp,
    };
  });

  const parsed = transactionRead.array().safeParse(serialized);
  if (parsed.success) return parsed.data;

  console.error("getUserTransactions validation error:", parsed.error.flatten());
  return [];
}

