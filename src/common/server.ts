import { transactionReadArray, type Transaction } from "@/common/schemas";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal
import { TransactionType, InputType } from "../generated/prisma"; // Import enums

interface PrismaTransaction {
  uuid: string;
  id: number;
  type: TransactionType; // Use enum
  user_uuid: string;
  timestamp: Date;
  amount: Decimal;
  recipient: string;
  input_mode: InputType; // Use enum
  recipient_name: string | null;
  reference: string | null;
  account: string | null;
  remarks: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number | null;
  subcategoryId: number | null;
  Category?: { id: number; name: string } | null;
  Subcategory?: { id: number; name: string } | null;
}

/**
 * Server-only: Fetch all transactions for a user and serialize Prisma types.
 */
export async function getUserTransactions(
  uuid: string,
  populateCategories: boolean = false,
): Promise<Transaction[]> {
  let txns: (PrismaTransaction & { Category?: { id: number; name: string } | null; Subcategory?: { id: number; name: string } | null; })[] = [];
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

  // Always serialize dates as UTC ISO strings; UI formats to Asia/Kolkata.
  function toUTCISOString(d: Date): string {
    return d.toISOString();
  }

  const serialized = txns.map((t) => {
    const amount = t.amount.toNumber(); // Direct call, as t.amount is Decimal
    const createdAtISO = toUTCISOString(t.createdAt);
    const updatedAtISO = toUTCISOString(t.updatedAt);
    const timestampISO = toUTCISOString(t.timestamp);

    const base = {
      uuid: t.uuid,
      id: t.id,
      user_uuid: t.user_uuid,
      type: String(t.type), // Convert enum to string
      amount,
      recipient: t.recipient,
      input_mode: String(t.input_mode), // Convert enum to string
      recipient_name: t.recipient_name ?? null,
      reference: t.reference ?? null,
      account: t.account ?? null,
      remarks: t.remarks ?? null,
      location: t.location ?? null,
      createdAt: createdAtISO,
      updatedAt: updatedAtISO,
      timestamp: timestampISO,
    } as Transaction; // Cast to Transaction, which expects string dates and number amount

    if (populateCategories) {
      base.category = t.Category?.name ?? null;
      base.subcategory = t.Subcategory?.name ?? null;
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