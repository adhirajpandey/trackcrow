"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

const addTransactionSchema = z.object({
  amount: z.coerce.number(),
  recipient: z.string(),
  recipient_name: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
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
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    remarks: formData.get("remarks"),
    timestamp: formData.get("timestamp"),
  });

  if (!validatedFields.success) {
    return { error: "Invalid fields", issues: validatedFields.error.issues };
  }

  const { amount, recipient, recipient_name, category, subcategory, remarks, timestamp } = validatedFields.data;

  try {
    await prisma.transaction.create({
      data: {
        user_uuid: session.user.uuid,
        amount,
        recipient,
        recipient_name,
        category,
        subcategory,
        remarks,
        timestamp: Math.floor(timestamp.getTime() / 1000),
        type: "MANUAL",
        input_mode: "MANUAL",
        uuid: crypto.randomUUID(),
      },
    });
  } catch {
    return { error: "Failed to create transaction" };
  }

  revalidatePath("/transactions");

  return { message: "Transaction added successfully" };
}
