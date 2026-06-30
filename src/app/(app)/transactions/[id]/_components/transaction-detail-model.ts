import { z } from "zod";

import type { CategoryOption, TransactionRecord } from "@/common/types";
import { formatDateTime, numberToINR, toDate } from "@/common/utils";
import { formatRecipientDisplayLabel } from "@/common/recipient-display";
import type {
  TransactionDetailFormValues,
  TransactionDetailSuggestion,
  TransactionMutationInput,
} from "@/features/transactions/types";

const IST_OFFSET_MINUTES = 330;

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const quickCheckDefinitions = [
  {
    key: "category",
    pendingLabel: "Category missing",
    passedLabel: "Category set",
  },
  {
    key: "source",
    pendingLabel: "Source unavailable",
    passedLabel: "Source recorded",
  },
  {
    key: "recipient",
    pendingLabel: "Recipient unclear",
    passedLabel: "Recipient linked",
  },
] as const;

export const transactionDetailFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "Enter an amount greater than 0",
    }),
  recipientRaw: z.string().trim().min(1, "Raw recipient is required"),
  recipientName: z.string().trim(),
  categoryId: z.string(),
  subcategoryId: z.string(),
  type: z.enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"]),
  timestamp: z
    .string()
    .trim()
    .min(1, "Timestamp is required")
    .refine((value) => !Number.isNaN(parseDateTimeLocalAsIst(value).getTime()), {
      message: "Enter a valid date and time",
    }),
  reference: z.string().trim(),
  accountLabel: z.string().trim(),
  remarks: z.string().trim(),
  locationRaw: z.string().trim(),
});

export type TransactionDetailFormSchema = z.infer<typeof transactionDetailFormSchema>;

export type TransactionQuickCheck = {
  id: string;
  label: string;
  status: "attention" | "passed";
};

export function formatTransactionDateTime(timestamp: string) {
  return formatDateTime(timestamp);
}

export function formatTransactionAmount(amount: number) {
  return numberToINR(amount);
}

export function formatDateTimeLocalValue(timestamp: string) {
  const parts = dateTimePartsFormatter.formatToParts(toDate(timestamp));
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}T${byType.get(
    "hour"
  )}:${byType.get("minute")}`;
}

export function parseDateTimeLocalAsIst(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) {
    return new Date(Number.NaN);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute - IST_OFFSET_MINUTES, second)
  );
}

export function mapTransactionToFormValues(
  transaction: TransactionRecord
): TransactionDetailFormValues {
  return {
    amount: String(transaction.amount),
    recipientRaw: transaction.recipientRaw,
    recipientName: transaction.recipientName ?? "",
    categoryId: transaction.categoryId == null ? "" : String(transaction.categoryId),
    subcategoryId: transaction.subcategoryId == null ? "" : String(transaction.subcategoryId),
    type: transaction.type,
    timestamp: formatDateTimeLocalValue(transaction.timestamp),
    reference: transaction.reference ?? "",
    accountLabel: transaction.accountLabel ?? "",
    remarks: transaction.remarks ?? "",
    locationRaw: transaction.locationRaw ?? "",
  };
}

export function mapFormValuesToTransactionPayload(
  values: TransactionDetailFormSchema
): TransactionMutationInput {
  return {
    amount: Number(values.amount),
    recipientRaw: values.recipientRaw.trim(),
    recipientName: toNullableTrimmedString(values.recipientName),
    categoryId: toNullableInteger(values.categoryId),
    subcategoryId: toNullableInteger(values.subcategoryId),
    type: values.type,
    timestamp: parseDateTimeLocalAsIst(values.timestamp).toISOString(),
    reference: toNullableTrimmedString(values.reference),
    accountLabel: toNullableTrimmedString(values.accountLabel),
    remarks: toNullableTrimmedString(values.remarks),
    locationRaw: toNullableTrimmedString(values.locationRaw),
  };
}

export function hasTransactionDetailChanges(
  transaction: TransactionRecord,
  values: TransactionDetailFormValues
) {
  const nextPayload = mapFormValuesToTransactionPayload(values);
  const currentPayload = mapTransactionToMutationPayload(transaction);

  return (
    nextPayload.amount !== currentPayload.amount ||
    nextPayload.recipientRaw !== currentPayload.recipientRaw ||
    nextPayload.recipientName !== currentPayload.recipientName ||
    nextPayload.categoryId !== currentPayload.categoryId ||
    nextPayload.subcategoryId !== currentPayload.subcategoryId ||
    nextPayload.type !== currentPayload.type ||
    nextPayload.timestamp !== currentPayload.timestamp ||
    nextPayload.reference !== currentPayload.reference ||
    nextPayload.accountLabel !== currentPayload.accountLabel ||
    nextPayload.remarks !== currentPayload.remarks ||
    nextPayload.locationRaw !== currentPayload.locationRaw
  );
}

export function getSubcategoryOptions(
  categories: CategoryOption[],
  categoryId: string
) {
  if (!categoryId) {
    return [];
  }

  const selectedCategoryId = Number(categoryId);
  if (!Number.isFinite(selectedCategoryId)) {
    return [];
  }

  return (
    categories.find((category) => category.id === selectedCategoryId)?.subcategories ?? []
  );
}

export function isValidSubcategorySelection(
  categories: CategoryOption[],
  categoryId: string,
  subcategoryId: string
) {
  if (!subcategoryId) {
    return true;
  }

  return getSubcategoryOptions(categories, categoryId).some(
    (subcategory) => String(subcategory.id) === subcategoryId
  );
}

export function applyTransactionSuggestion(
  categories: CategoryOption[],
  suggestion: TransactionDetailSuggestion
) {
  const category = suggestion.suggestedCategory
    ? categories.find((item) => item.name === suggestion.suggestedCategory)
    : null;
  const subcategory =
    category && suggestion.suggestedSubCategory
      ? category.subcategories.find((item) => item.name === suggestion.suggestedSubCategory)
      : null;

  return {
    categoryId: category ? String(category.id) : "",
    subcategoryId: subcategory ? String(subcategory.id) : "",
    matched: Boolean(category),
  };
}

export function buildTransactionQuickChecks(transaction: TransactionRecord): TransactionQuickCheck[] {
  const recipientLabel = formatRecipientDisplayLabel({
    recipientName: transaction.recipientName,
    recipientDisplayName: transaction.recipientDisplayName,
    recipientRaw: transaction.recipientRaw,
    fallbackLabel: "",
  });

  const checks = {
    category: transaction.categoryId != null,
    source: Boolean(transaction.source),
    recipient: recipientLabel.trim().length > 0,
  };

  return quickCheckDefinitions.map((check) => ({
    id: check.key,
    label: checks[check.key] ? check.passedLabel : check.pendingLabel,
    status: checks[check.key] ? "passed" : "attention",
  }));
}

export function getTransactionDisplayRecipient(transaction: TransactionRecord) {
  return formatRecipientDisplayLabel({
    recipientName: transaction.recipientName,
    recipientDisplayName: transaction.recipientDisplayName,
    recipientRaw: transaction.recipientRaw,
  });
}

export function getRecipientDetailHref(transaction: TransactionRecord) {
  return `/recipients/${transaction.recipientId}`;
}

export function getTransactionGoogleMapsHref(locationRaw: string | null | undefined) {
  const coordinates = parseTransactionCoordinates(locationRaw);
  if (!coordinates) {
    return null;
  }

  return `https://www.google.com/maps/search/${encodeURIComponent(
    `${coordinates.latitude},${coordinates.longitude}`
  )}`;
}

function mapTransactionToMutationPayload(
  transaction: TransactionRecord
): TransactionMutationInput {
  return {
    amount: transaction.amount,
    recipientRaw: transaction.recipientRaw.trim(),
    recipientName: toNullableTrimmedString(transaction.recipientName ?? ""),
    categoryId: transaction.categoryId,
    subcategoryId: transaction.subcategoryId,
    type: transaction.type,
    timestamp: toDate(transaction.timestamp).toISOString(),
    reference: toNullableTrimmedString(transaction.reference ?? ""),
    accountLabel: toNullableTrimmedString(transaction.accountLabel ?? ""),
    remarks: toNullableTrimmedString(transaction.remarks ?? ""),
    locationRaw: toNullableTrimmedString(transaction.locationRaw ?? ""),
  };
}

function toNullableTrimmedString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseTransactionCoordinates(locationRaw: string | null | undefined) {
  const trimmed = locationRaw?.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(
    /(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/
  );
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude: match[1], longitude: match[2] };
}
