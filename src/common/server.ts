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

  function formatISTISO(d: Date): string {
    const pad = (n: number, w: number = 2) => String(n).padStart(w, "0");
    const yyyy = d.getUTCFullYear();
    const mm = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const HH = pad(d.getUTCHours());
    const MM = pad(d.getUTCMinutes());
    const SS = pad(d.getUTCSeconds());
    const mmm = pad(d.getUTCMilliseconds(), 3);
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}.${mmm}+05:30`;
  }

  const serialized = txns.map((t) => {
    const amount =
      typeof t.amount?.toNumber === "function" ? t.amount.toNumber() : Number(t.amount);
    const createdAtISO = t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt);
    const updatedAtISO = t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt);
    const timestampISO = t.timestamp instanceof Date
      ? formatISTISO(t.timestamp)
      : String(t.timestamp);

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
      timestamp: timestampISO,
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
