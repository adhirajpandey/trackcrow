import { z } from "zod";

import type { TransactionCreateInput } from "@/features/transactions/types";
import {
  formatDateTimeLocalValue,
  parseDateTimeLocalAsIst,
} from "@/app/(app)/transactions/[id]/_components/transaction-detail-model";

export const transactionCreateFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "Enter an amount greater than 0",
    }),
  recipientUuid: z.string().uuid("Select a recipient"),
  categoryUuid: z.string(),
  subcategoryUuid: z.string(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]),
  timestamp: z
    .string()
    .trim()
    .min(1, "Date and time are required")
    .refine(
      (value) => !Number.isNaN(parseDateTimeLocalAsIst(value).getTime()),
      {
        message: "Enter a valid date and time",
      },
    ),
  reference: z.string().trim(),
  accountLabel: z.string().trim(),
  remarks: z.string().trim(),
  locationRaw: z.string().trim(),
});

export type TransactionCreateFormSchema = z.infer<
  typeof transactionCreateFormSchema
>;

export function getCreateTransactionDefaultValues(
  now = new Date(),
): TransactionCreateFormSchema {
  return {
    amount: "",
    recipientUuid: "",
    categoryUuid: "",
    subcategoryUuid: "",
    type: "UPI",
    timestamp: formatDateTimeLocalValue(now.toISOString()),
    reference: "",
    accountLabel: "",
    remarks: "",
    locationRaw: "",
  };
}

export function mapCreateFormValuesToPayload(
  values: TransactionCreateFormSchema,
): TransactionCreateInput {
  return {
    amount: Number(values.amount),
    recipientUuid: values.recipientUuid,
    categoryUuid: toNullableValue(values.categoryUuid),
    subcategoryUuid: toNullableValue(values.subcategoryUuid),
    type: values.type,
    timestamp: parseDateTimeLocalAsIst(values.timestamp).toISOString(),
    reference: toNullableValue(values.reference),
    accountLabel: toNullableValue(values.accountLabel),
    remarks: toNullableValue(values.remarks),
    locationRaw: toNullableValue(values.locationRaw),
  };
}

function toNullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
