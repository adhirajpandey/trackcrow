import { z } from "zod";

import type { CategoryOption, TransactionRecord } from "@/common/types";
import { formatDateTime, numberToINR, toDate } from "@/common/utils";
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

export const transactionDetailFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "Enter an amount greater than 0",
    }),
  categoryUuid: z.string(),
  subcategoryUuid: z.string(),
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
    categoryUuid: transaction.categoryUuid ?? "",
    subcategoryUuid: transaction.subcategoryUuid ?? "",
    type: transaction.type,
    timestamp: formatDateTimeLocalValue(transaction.timestamp),
    reference: transaction.reference ?? "",
    accountLabel: transaction.accountLabel ?? "",
    remarks: transaction.remarks ?? "",
    locationRaw: transaction.locationRaw ?? "",
  };
}

export function mapFormValuesToTransactionPayload(
  transaction: TransactionRecord,
  values: TransactionDetailFormSchema
): TransactionMutationInput {
  return {
    amount: Number(values.amount),
    categoryUuid: toNullableUuid(values.categoryUuid),
    subcategoryUuid: toNullableUuid(values.subcategoryUuid),
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
  const nextPayload = mapFormValuesToTransactionPayload(transaction, values);
  const currentPayload = mapTransactionToMutationPayload(transaction);

  return (
    nextPayload.amount !== currentPayload.amount ||
    nextPayload.categoryUuid !== currentPayload.categoryUuid ||
    nextPayload.subcategoryUuid !== currentPayload.subcategoryUuid ||
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
  categoryUuid: string
) {
  if (!categoryUuid) {
    return [];
  }

  return (
    categories.find((category) => category.uuid === categoryUuid)?.subcategories ?? []
  );
}

export function isValidSubcategorySelection(
  categories: CategoryOption[],
  categoryUuid: string,
  subcategoryUuid: string
) {
  if (!subcategoryUuid) {
    return true;
  }

  return getSubcategoryOptions(categories, categoryUuid).some(
    (subcategory) => subcategory.uuid === subcategoryUuid
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
    categoryUuid: category?.uuid ?? "",
    subcategoryUuid: subcategory?.uuid ?? "",
    matched: Boolean(category),
  };
}

type TransactionDetailShortcutEventLike = {
  defaultPrevented: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
};

export function shouldIgnoreTransactionDetailShortcut(
  event: TransactionDetailShortcutEventLike
) {
  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return true;
  }

  return isEditableShortcutTarget(event.target);
}

export function getTransactionDisplayRecipient(transaction: TransactionRecord) {
  return transaction.recipientDisplayName;
}

export function getRecipientDetailHref(transaction: TransactionRecord) {
  return `/recipients/${transaction.recipientUuid}`;
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
    categoryUuid: transaction.categoryUuid,
    subcategoryUuid: transaction.subcategoryUuid,
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

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const candidate = target as {
    closest?: (selector: string) => unknown;
    tagName?: string;
    isContentEditable?: boolean;
    getAttribute?: (name: string) => string | null;
  };

  if (typeof candidate.closest === "function") {
    return Boolean(
      candidate.closest("input, textarea, select, button, [contenteditable], [role='textbox']")
    );
  }

  const tagName = candidate.tagName?.toLowerCase();
  if (tagName && ["input", "textarea", "select", "button"].includes(tagName)) {
    return true;
  }

  if (candidate.isContentEditable) {
    return true;
  }

  return (
    candidate.getAttribute?.("role") === "textbox" ||
    candidate.getAttribute?.("contenteditable") != null
  );
}

function toNullableUuid(value: string) {
  return value || null;
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
