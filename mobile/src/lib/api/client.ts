import { debugLog, debugPath } from '../debug-log';
export const DEFAULT_API_URL = 'https://trackcrow.in';

/** How the stored token was obtained. Google sessions show the account and revoke on sign-out. */
export type Credentials = { apiUrl: string; token: string } & (
  | { method: 'google'; email: string }
  | { method: 'token' }
);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code?: string,
    readonly issues?: unknown,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function normalizeApiUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Enter a full server URL, such as https://trackcrow.example.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Enter an HTTP or HTTPS server URL without credentials, query, or fragment.');
  }
  return url.toString().replace(/\/+$/, '');
}

function errorForStatus(status: number): ApiError {
  if (status === 401)
    return new ApiError('Your sign-in has expired or was revoked. Sign in again in Settings.', status);
  if (status === 403) return new ApiError('This sign-in does not have permission for this action.', status);
  if (status === 503) return new ApiError('TrackCrow is temporarily unavailable. Try again shortly.', status);
  return new ApiError(`TrackCrow returned an error (HTTP ${status}).`, status);
}

export async function send(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, credentials: 'omit' });
    if (!response.ok) debugLog.write('api.error', { status: response.status, path: debugPath(new URL(url).pathname) }, 'error');
    return response;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('Could not reach TrackCrow. Check your connection and server URL.', null);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
}

type UnauthorizedListener = (credentials: Credentials) => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();
export function subscribeUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export async function responseError(response: Response): Promise<ApiError> {
  const fallback = errorForStatus(response.status);
  let body: { message?: unknown; code?: unknown; issues?: unknown; details?: unknown } = {};
  try {
    body = (await response.json()) ?? {};
  } catch {
    /* Empty or non-JSON error. */
  }
  return new ApiError(
    response.status === 401 || response.status === 403
      ? fallback.message
      : typeof body.message === 'string'
        ? body.message
        : fallback.message,
    response.status,
    typeof body.code === 'string' ? body.code : undefined,
    body.issues,
    body.details,
  );
}

async function requestJson<T>(
  credentials: Credentials,
  path: string,
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await send(
    `${normalizeApiUrl(credentials.apiUrl)}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    signal,
  );
  if (!response.ok) {
    if (response.status === 401) unauthorizedListeners.forEach((listener) => listener(credentials));
    throw await responseError(response);
  }
  if (response.status === 204) return undefined as T;
  return readJson<T>(response);
}

export const getJson = <T>(credentials: Credentials, path: string, signal?: AbortSignal) =>
  requestJson<T>(credentials, path, 'GET', undefined, signal);
export const postJson = <T>(credentials: Credentials, path: string, body: unknown, signal?: AbortSignal) =>
  requestJson<T>(credentials, path, 'POST', body, signal);
export const patchJson = <T>(credentials: Credentials, path: string, body: unknown, signal?: AbortSignal) =>
  requestJson<T>(credentials, path, 'PATCH', body, signal);
export const deleteJson = <T = void>(credentials: Credentials, path: string, signal?: AbortSignal) =>
  requestJson<T>(credentials, path, 'DELETE', undefined, signal);

export type Page = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
export type UuidResult = { uuid: string };
export function queryString(params: object = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
  });
  return query.size ? `?${query}` : '';
}
