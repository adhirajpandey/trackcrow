"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

const updateTransactionSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  // allow empty string (treated as null)
  recipient_name: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  // allow empty string (treated as null)
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export async function updateTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: "Unauthorized" };
  }

  const parsed = updateTransactionSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    recipient: formData.get("recipient"),
    recipient_name: formData.get("recipient_name"),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId"),
    type: formData.get("type"),
    remarks: formData.get("remarks"),
    timestamp: formData.get("timestamp"),
  });

  if (!parsed.success) {
    return { error: "Invalid fields", issues: parsed.error.issues } as const;
  }

  const { id, amount, recipient, recipient_name, categoryId, subcategoryId, type, remarks, timestamp } = parsed.data;

  try {
    const existing = await prisma.transaction.findFirst({ where: { id, user_uuid: session.user.uuid } });
    if (!existing) {
      return { error: "Transaction not found" } as const;
    }

    const recipientNameForDb =
      typeof recipient_name === "string" && recipient_name.trim() === ""
        ? null
        : recipient_name ?? null;
    const remarksForDb =
      typeof remarks === "string" && remarks.trim() === ""
        ? null
        : remarks ?? null;

    await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        recipient,
        recipient_name: recipientNameForDb,
        categoryId,
        subcategoryId,
        type,
        remarks: remarksForDb,
        ist_datetime: timestamp,
      },
    });
  } catch (error) {
    console.error("Failed to update transaction", error);
    return { error: "Failed to update transaction" } as const;
  }

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${parsed.data.id}`);

  return { message: "Transaction updated successfully" } as const;
}
