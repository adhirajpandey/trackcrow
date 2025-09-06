import { transactionReadArray, type Transaction } from "@/common/schemas";
import prisma from "@/lib/prisma";

/**
 * Server-only: Fetch all transactions for a user and serialize Prisma types.
 */
export async function getUserTransactions(
  uuid: string,
  populateCategories: boolean = false,
): Promise<Transaction[]> {
  let txns: any[] = [];
  try {
    txns = await prisma.transaction.findMany({
      where: { user_uuid: uuid },
      orderBy: { timestamp: "desc" },
      include: populateCategories
        ? {
            Category: { select: { id: true, name: true } },
            Subcategory: { select: { id: true, name: true } },
          }
        : undefined,
    });
  } catch (e) {
    console.error("getUserTransactions prisma error:", e);
    return [];
  }

  const serialized = txns.map((t) => {
    const amount =
      typeof t.amount?.toNumber === "function" ? t.amount.toNumber() : Number(t.amount);
    const createdAtISO = t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt);
    const updatedAtISO = t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt);
    const timestamp = t.timestamp instanceof Date
      ? t.timestamp.getTime()
      : new Date(t.createdAt).getTime();

    const base = {
      uuid: t.uuid,
      id: t.id,
      user_uuid: t.user_uuid,
      type: String(t.type),
      amount,
      recipient: t.recipient,
      input_mode: t.input_mode,
      recipient_name: t.recipient_name ?? null,
      reference: t.reference ?? null,
      account: t.account ?? null,
      remarks: t.remarks ?? null,
      location: t.location ?? null,
      createdAt: createdAtISO,
      updatedAt: updatedAtISO,
      timestamp,
    } as any;

    if (populateCategories) {
      base.category = (t as any).Category?.name ?? null;
      base.subcategory = (t as any).Subcategory?.name ?? null;
    }

    return base;
  });

  // Validate and coerce to the expected shape
  const parsed = transactionReadArray.safeParse(serialized);
  if (parsed.success) return parsed.data;

  console.error("getUserTransactions validation error:", parsed.error.flatten());
  // Be tolerant: return serialized data best-effort to avoid hard-failing pages
  // Consumers defensively handle missing fields.
  return serialized as unknown as Transaction[];
}
