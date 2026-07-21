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

export const AUTO_CLASSIFY_VALUE = "__auto__";

export function getCreateTransactionDefaultValues(
  now = new Date(),
): TransactionCreateFormSchema {
  return {
    amount: "",
    recipientUuid: "",
    categoryUuid: AUTO_CLASSIFY_VALUE,
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
  const payload: TransactionCreateInput = {
    amount: Number(values.amount),
    recipientUuid: values.recipientUuid,
    type: values.type,
    timestamp: parseDateTimeLocalAsIst(values.timestamp).toISOString(),
    reference: toNullableValue(values.reference),
    accountLabel: toNullableValue(values.accountLabel),
    remarks: toNullableValue(values.remarks),
    locationRaw: toNullableValue(values.locationRaw),
  };
  if (values.categoryUuid !== AUTO_CLASSIFY_VALUE) {
    payload.categoryUuid = toNullableValue(values.categoryUuid);
    payload.subcategoryUuid = toNullableValue(values.subcategoryUuid);
  }
  return payload;
}

function toNullableValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
