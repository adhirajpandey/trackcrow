import "server-only";

import { headers } from "next/headers";

import type {
  CategoryOption,
  DeviceTokenRecord,
  TransactionListResponse,
  TransactionRecord,
  TransactionSource,
  TransactionType,
} from "@/common/types";
import type { RecipientListResponse } from "@/features/recipients/types";

type JsonBody = Record<string, unknown> | Array<unknown> | null;

export class InternalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: JsonBody
  ) {
    super(message);
  }
}

async function buildInternalApiUrl(path: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    throw new Error("Unable to resolve internal API host");
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}${path}`;
}

async function readJsonBody(response: Response): Promise<JsonBody> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as JsonBody;
}

async function internalApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const requestHeaders = await headers();
  const forwardedHeaders = new Headers(init?.headers);
  const cookie = requestHeaders.get("cookie");
  if (cookie && !forwardedHeaders.has("cookie")) {
    forwardedHeaders.set("cookie", cookie);
  }
  if (!forwardedHeaders.has("accept")) {
    forwardedHeaders.set("accept", "application/json");
  }

  const response = await fetch(await buildInternalApiUrl(path), {
    ...init,
    headers: forwardedHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `Internal API request failed with status ${response.status}`;
    throw new InternalApiError(message, response.status, body);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function jsonRequestInit(method: string, body?: Record<string, unknown>): RequestInit {
  const headers = new Headers();
  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof InternalApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function isInternalApiError(error: unknown): error is InternalApiError {
  return error instanceof InternalApiError;
}

export async function getCategories() {
  return internalApiRequest<CategoryOption[]>("/api/categories");
}

export async function getTransactions(pathnameQuery: string) {
  return internalApiRequest<TransactionListResponse>(`/api/transactions${pathnameQuery}`);
}

export async function getRecipients(pathnameQuery: string) {
  return internalApiRequest<RecipientListResponse>(`/api/recipients${pathnameQuery}`);
}

export async function getTransaction(transactionUuid: string) {
  return internalApiRequest<TransactionRecord>(`/api/transactions/${transactionUuid}`);
}

export async function getDeviceTokens() {
  return internalApiRequest<DeviceTokenRecord[]>("/api/device-tokens");
}

export async function createManualTransaction(input: {
  amount: number;
  recipientRaw: string;
  recipientName?: string | null;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
  type: TransactionType;
  remarks?: string | null;
  timestamp: string;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
}) {
  return internalApiRequest<{ uuid: string }>(
    "/api/transactions",
    jsonRequestInit("POST", input)
  );
}

export async function updateManualTransaction(
  transactionUuid: string,
  input: {
    amount: number;
    recipientRaw: string;
    recipientName?: string | null;
    categoryUuid?: string | null;
    subcategoryUuid?: string | null;
    type: TransactionType;
    remarks?: string | null;
    timestamp: string;
    reference?: string | null;
    accountLabel?: string | null;
    locationRaw?: string | null;
    source?: TransactionSource;
  }
) {
  return internalApiRequest<{ uuid: string }>(
    `/api/transactions/${transactionUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteManualTransaction(transactionUuid: string) {
  return internalApiRequest<{ uuid: string }>(
    `/api/transactions/${transactionUuid}`,
    jsonRequestInit("DELETE")
  );
}

export async function createCategoryRecord(input: { name: string }) {
  return internalApiRequest<{ uuid: string }>(
    "/api/categories",
    jsonRequestInit("POST", input)
  );
}

export async function updateCategoryRecord(categoryUuid: string, input: { name: string }) {
  return internalApiRequest<{ uuid: string }>(
    `/api/categories/${categoryUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteCategoryRecord(categoryUuid: string) {
  return internalApiRequest<{ uuid: string }>(
    `/api/categories/${categoryUuid}`,
    jsonRequestInit("DELETE")
  );
}

export async function resetCategoryDefaults() {
  return internalApiRequest<{ reset: true }>(
    "/api/categories/reset-defaults",
    jsonRequestInit("POST")
  );
}

export async function createSubcategoryRecord(input: {
  categoryUuid: string;
  name: string;
}) {
  return internalApiRequest<{ uuid: string }>(
    "/api/subcategories",
    jsonRequestInit("POST", input)
  );
}

export async function updateSubcategoryRecord(
  subcategoryUuid: string,
  input: {
    categoryUuid: string;
    name: string;
  }
) {
  return internalApiRequest<{ uuid: string }>(
    `/api/subcategories/${subcategoryUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteSubcategoryRecord(subcategoryUuid: string) {
  return internalApiRequest<{ uuid: string }>(
    `/api/subcategories/${subcategoryUuid}`,
    jsonRequestInit("DELETE")
  );
}
