"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

const addTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]).default("UPI"),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export async function addTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: "Unauthorized" };
  }

  const validatedFields = addTransactionSchema.safeParse({
    amount: formData.get("amount"),
    recipient: formData.get("recipient"),
    recipient_name: formData.get("recipient_name"),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId"),
    type: formData.get("type"),
    remarks: formData.get("remarks"),
    timestamp: formData.get("timestamp"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields", issues: validatedFields.error.issues };
  }

  const { amount, recipient, recipient_name, categoryId, subcategoryId, type, remarks, timestamp } = validatedFields.data;

  try {
    await prisma.transaction.create({
      data: {
        user_uuid: session.user.uuid,
        amount,
        recipient,
        recipient_name,
        categoryId,
        subcategoryId,
        type,
        remarks,
        timestamp: timestamp,
        input_mode: "MANUAL",
        uuid: crypto.randomUUID(),
      },
    });
  } catch(error) {
    console.error("Failed to create transaction", error);
    return { error: "Failed to create transaction" };
  }

  revalidatePath("/transactions");

  return { message: "Transaction added successfully" };
}
