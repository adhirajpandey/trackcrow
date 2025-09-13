"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateSession, validateTransactionOwnership } from "@/common/server";

const updateTransactionSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional().nullable(),
  // Simplified: accept number or empty string -> null
  categoryId: z
    .preprocess((v) => (v === "" ? null : v), z.union([z.coerce.number().int().positive(), z.null()]))
    .optional(),
  subcategoryId: z
    .preprocess((v) => (v === "" ? null : v), z.union([z.coerce.number().int().positive(), z.null()]))
    .optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  remarks: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional().nullable(),
});

export async function updateTransaction(formData: FormData) {
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error };
  }
  const { userUuid } = sessionResult;

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
    console.error("Failed to parse update transaction form data", parsed.error);
    return { error: "Invalid fields", issues: parsed.error.issues } as const;
  }

  const { id, amount, recipient, recipient_name, categoryId, subcategoryId, type, remarks, timestamp } = parsed.data;

  try {
    const transactionResult = await validateTransactionOwnership(id, userUuid);
    if (!transactionResult.success) {
      return { error: transactionResult.error } as const;
    }

    const recipientNameForDb =
      typeof recipient_name === "string" && recipient_name.trim() === ""
        ? null
        : recipient_name ?? null;
    const remarksForDb =
      typeof remarks === "string" && remarks.trim() === ""
        ? null
        : remarks ?? null;

    const updateData: {
      amount: number;
      recipient: string;
      recipient_name: string | null;
      type: "UPI" | "CARD" | "CASH" | "NETBANKING" | "OTHER";
      remarks: string | null;
      timestamp?: Date;
      categoryId?: number | null;
      subcategoryId?: number | null;
    } = {
      amount,
      recipient,
      recipient_name: recipientNameForDb,
      type,
      remarks: remarksForDb,
      ...(timestamp ? { timestamp } : {}),
    };
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId; // number | null
      if (categoryId === null) {
        // If category cleared, also clear subcategory to maintain consistency
        updateData.subcategoryId = null;
      } else if (typeof categoryId === "number" && subcategoryId === undefined) {
        // Category set but no subcategory provided -> clear existing subcategory
        updateData.subcategoryId = null;
      }
    }
    if (subcategoryId !== undefined) {
      updateData.subcategoryId = subcategoryId; // number | null
    }

    await prisma.transaction.update({ where: { id }, data: updateData });
  } catch (error) {
    console.error("Failed to update transaction", error);
    return { error: "Failed to update transaction" } as const;
  }

  revalidatePath("/transactions");
  revalidatePath(`/transactions/${parsed.data.id}`);

  return { message: "Transaction updated successfully" } as const;
}

export async function deleteTransaction(transactionId: number) {
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error };
  }
  const { userUuid } = sessionResult;

  try {
    // Check if transaction exists and belongs to user
    const transactionResult = await validateTransactionOwnership(transactionId, userUuid);
    if (!transactionResult.success) {
      return { error: transactionResult.error };
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    });

    // Revalidate the transactions page to update the UI
    revalidatePath("/transactions");
    revalidatePath(`/transactions/${transactionId}`);

    return { message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("Failed to delete transaction", error);
    return { error: "Failed to delete transaction" };
  }
}
