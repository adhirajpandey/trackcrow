export type ApiErrorBody = {
  message?: string;
  issues?: unknown;
  details?: unknown;
  [key: string]: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body" | "method"> & {
  body?: unknown;
};

async function parseJsonBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeApiErrorBody(body: unknown): ApiErrorBody | null {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as ApiErrorBody;
  }

  return null;
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) {
    return new URL(path, baseUrl).toString();
  }

  return path;
}

async function apiRequest<T>(
  method: string,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    method,
    credentials: options.credentials ?? "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const parsedBody = await parseJsonBody(response);

  if (!response.ok) {
    const errorBody = normalizeApiErrorBody(parsedBody);
    const message =
      typeof errorBody?.message === "string" && errorBody.message.length > 0
        ? errorBody.message
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(response.status, message, errorBody);
  }

  return parsedBody as T;
}

export function apiGet<T>(path: string, options?: ApiRequestOptions) {
  return apiRequest<T>("GET", path, options);
}

export function apiPost<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>("POST", path, { ...options, body });
}

export function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
) {
  return apiRequest<T>("PATCH", path, { ...options, body });
}

export function apiDelete<T>(path: string, options?: ApiRequestOptions) {
  return apiRequest<T>("DELETE", path, options);
}

export function getApiClientErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
