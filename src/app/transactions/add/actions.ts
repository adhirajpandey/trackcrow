"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateSession } from "@/common/server";

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
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error };
  }
  const { userUuid } = sessionResult;

  // Normalize optional fields: convert null to undefined so optional() is respected
  const getOpt = (v: FormDataEntryValue | null) => (v === null ? undefined : v);

  const validatedFields = addTransactionSchema.safeParse({
    amount: formData.get("amount"),
    recipient: formData.get("recipient"),
    recipient_name: getOpt(formData.get("recipient_name")),
    categoryId: formData.get("categoryId"),
    subcategoryId: getOpt(formData.get("subcategoryId")),
    type: formData.get("type"),
    remarks: getOpt(formData.get("remarks")),
    timestamp: formData.get("timestamp"),
  });

  if (!validatedFields.success) {
    console.log("Validation failed", validatedFields.error.issues);
    return { error: "Invalid fields", issues: validatedFields.error.issues };
  }

  const { amount, recipient, recipient_name, categoryId, subcategoryId, type, remarks, timestamp } = validatedFields.data;

  try {
    await prisma.transaction.create({
      data: {
        user_uuid: userUuid,
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
