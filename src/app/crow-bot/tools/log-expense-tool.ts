import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMAS ----------------------------- */

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

export const logExpenseSchema = z.object({}).passthrough();

/* ----------------------------- HELPERS ----------------------------- */

function extractTransactionFields(structured_data: any) {
  if (!structured_data || typeof structured_data !== "object") {
    console.warn(
      "⚠️ Invalid structured_data passed to logExpenseTool:",
      structured_data
    );
    return {};
  }

  const {
    amount = null,
    recipient = null,
    recipient_name = null,
    category = null,
    categoryId = null,
    subcategory = null,
    subcategoryId = null,
    type = "UPI",
    remarks = "",
    description = "",
    date = null,
    timestamp = null,
  } = structured_data;

  const parsedAmount =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^0-9.]/g, ""))
      : amount;

  const parsedTimestamp = timestamp
    ? new Date(timestamp).toISOString()
    : date
      ? new Date(`${date}T00:00:00+05:30`).toISOString()
      : new Date().toISOString();

  return {
    amount: parsedAmount ?? 0,
    recipient: recipient ?? recipient_name ?? "Unknown",
    recipient_name: recipient_name ?? recipient ?? "Unknown",
    category,
    categoryId,
    subcategory,
    subcategoryId,
    type: type ?? "UPI",
    remarks: remarks || description || "",
    timestamp: parsedTimestamp,
  };
}

/* ----------------------------- TOOL EXECUTION ----------------------------- */

export async function runLogExpense(input: any) {
  const structured =
    "structured_data" in input
      ? extractTransactionFields(input.structured_data)
      : extractTransactionFields(input);

  const {
    amount,
    recipient,
    recipient_name,
    category,
    subcategory,
    type,
    remarks,
    timestamp,
  } = structured;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error || "User not authenticated." };
  }
  const { userUuid } = sessionResult;

  const categoryRecord = await prisma.category.findFirst({
    where: {
      user_uuid: userUuid,
      name: { equals: category, mode: "insensitive" },
    },
  });

  const subcategoryRecord = subcategory
    ? await prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: subcategory, mode: "insensitive" },
        },
      })
    : null;

  if (!categoryRecord) {
    return {
      message: `❌ Category "${category}" not found. Please add it first or select an existing one.`,
    };
  }

  const validatedFields = addTransactionSchema.safeParse({
    amount,
    recipient,
    recipient_name,
    categoryId: categoryRecord.id,
    subcategoryId: subcategoryRecord?.id,
    type,
    remarks,
    timestamp,
  });

  if (!validatedFields.success) {
    console.log("Validation failed", validatedFields.error.issues);
    return {
      error: "Invalid transaction data",
      issues: validatedFields.error.issues,
    };
  }

  const { categoryId, subcategoryId } = validatedFields.data;

  if (!timestamp) throw new Error("Timestamp is required");

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
        timestamp: new Date(timestamp),
        input_mode: "MANUAL",
        uuid: crypto.randomUUID(),
      },
    });

    return {
      message: `✅ Transaction logged: ${recipient} — ₹${amount} (${category}${
        subcategory ? " / " + subcategory : ""
      })`,
      amount,
      recipient,
      category,
      subcategory,
      type,
      remarks,
      timestamp,
    };
  } catch (error: any) {
    console.error("Failed to create transaction", error);
    return { error: "Failed to save transaction" };
  }
}

/* ----------------------------- EXPORT TOOL ----------------------------- */

export const logExpenseTool = createTool({
  name: "logExpense",
  description:
    "Log a new financial transaction into the database and return a summary card.",
  inputSchema: logExpenseSchema,
  execute: runLogExpense,
});
