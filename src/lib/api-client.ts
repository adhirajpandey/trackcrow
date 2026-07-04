type JsonBody = Record<string, unknown> | Array<unknown> | null;

class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: JsonBody
  ) {
    super(message);
  }
}

async function readJsonBody(response: Response): Promise<JsonBody> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as JsonBody;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await readJsonBody(response);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `API request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, body);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function jsonRequestInit(method: string, body?: Record<string, unknown>): RequestInit {
  return {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function createManualTransaction(input: {
  amount: number;
  recipientRaw: string;
  recipientName?: string | null;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
  type: string;
  remarks?: string | null;
  timestamp: string;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
}) {
  return apiRequest<{ uuid: string }>(
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
    type: string;
    remarks?: string | null;
    timestamp: string;
    source?: string;
    reference?: string | null;
    accountLabel?: string | null;
    locationRaw?: string | null;
  }
) {
  return apiRequest<{ uuid: string }>(
    `/api/transactions/${transactionUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteManualTransaction(transactionUuid: string) {
  return apiRequest<{ uuid: string }>(
    `/api/transactions/${transactionUuid}`,
    jsonRequestInit("DELETE")
  );
}

export async function createCategoryRecord(input: { name: string }) {
  return apiRequest<{ uuid: string }>(
    "/api/categories",
    jsonRequestInit("POST", input)
  );
}

export async function updateCategoryRecord(categoryUuid: string, input: { name: string }) {
  return apiRequest<{ uuid: string }>(
    `/api/categories/${categoryUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteCategoryRecord(categoryUuid: string) {
  return apiRequest<{ uuid: string }>(
    `/api/categories/${categoryUuid}`,
    jsonRequestInit("DELETE")
  );
}

export async function resetCategoryDefaults() {
  return apiRequest<{ reset: true }>(
    "/api/categories/reset-defaults",
    jsonRequestInit("POST")
  );
}

export async function createSubcategoryRecord(input: {
  categoryUuid: string;
  name: string;
}) {
  return apiRequest<{ uuid: string }>(
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
  return apiRequest<{ uuid: string }>(
    `/api/subcategories/${subcategoryUuid}`,
    jsonRequestInit("PATCH", input)
  );
}

export async function deleteSubcategoryRecord(subcategoryUuid: string) {
  return apiRequest<{ uuid: string }>(
    `/api/subcategories/${subcategoryUuid}`,
    jsonRequestInit("DELETE")
  );
}
