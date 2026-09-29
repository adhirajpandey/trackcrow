export const DEFAULT_API_URL = 'https://trackcrow.in';

/** How the stored token was obtained. Google sessions show the account and revoke on sign-out. */
export type Credentials = { apiUrl: string; token: string } & (
  | { method: 'google'; email: string }
  | { method: 'token' }
);

export type GoogleSession = { token: string; user: { name: string; email: string } };

export type DashboardSummary = {
  totalSpend: number;
  transactionCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  averageSpend: number;
};

export type CategorySpend = {
  category: string;
  totalSpend: number;
  transactionCount: number;
};

export type TransactionType = 'UPI' | 'CARD' | 'CASH' | 'NETBANKING' | 'OTHER';

export type Transaction = {
  uuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  recipientDisplayName: string;
  accountName: string | null;
  timestamp: string;
  category: string | null;
  subcategory: string | null;
};

export type DateRange = { startDate: Date; endDate: Date };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
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
  if (status === 401) return new ApiError('Your sign-in has expired or was revoked. Sign in again in Settings.', status);
  if (status === 403) return new ApiError('The access token needs the transactions:read scope.', status);
  if (status === 503) return new ApiError('TrackCrow is temporarily unavailable. Try again shortly.', status);
  return new ApiError(`TrackCrow returned an error (HTTP ${status}).`, status);
}

async function send(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, credentials: 'omit' });
  } catch {
    throw new ApiError('Could not reach TrackCrow. Check your connection and server URL.', null);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
}

async function getJson<T>(credentials: Credentials, path: string, signal?: AbortSignal): Promise<T> {
  const response = await send(
    `${credentials.apiUrl}${path}`,
    { headers: { Authorization: `Bearer ${credentials.token}` } },
    signal,
  );
  if (!response.ok) throw errorForStatus(response.status);
  return readJson<T>(response);
}

/** Reads the Google web client ID the server verifies ID tokens against. */
export async function fetchGoogleClientId(apiUrl: string): Promise<string> {
  const response = await send(`${normalizeApiUrl(apiUrl)}/api/mobile/auth/google`, {});
  if (response.status === 404) throw new ApiError('This server does not support Google sign-in.', 404);
  if (response.status === 503) throw new ApiError('Google sign-in is not configured on this server.', 503);
  if (!response.ok) throw errorForStatus(response.status);
  const { webClientId } = await readJson<{ webClientId?: unknown }>(response);
  if (typeof webClientId !== 'string' || !webClientId) {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
  return webClientId;
}

/** Exchanges a Google ID token for a TrackCrow token. */
export async function exchangeGoogleIdToken(apiUrl: string, idToken: string): Promise<GoogleSession> {
  const response = await send(`${normalizeApiUrl(apiUrl)}/api/mobile/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (response.status === 401) {
    throw new ApiError('TrackCrow could not verify this Google account. Use a verified Google account.', 401);
  }
  if (!response.ok) throw errorForStatus(response.status);
  const session = await readJson<Partial<GoogleSession>>(response);
  if (typeof session.token !== 'string' || typeof session.user?.email !== 'string') {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
  return { token: session.token, user: { name: session.user.name ?? '', email: session.user.email } };
}

/** Revokes the stored token on the server. A token that is already invalid counts as revoked. */
export async function revokeSession(credentials: Credentials): Promise<void> {
  const response = await send(`${normalizeApiUrl(credentials.apiUrl)}/api/mobile/auth/session`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${credentials.token}` },
  });
  if (!response.ok && response.status !== 401) throw errorForStatus(response.status);
}

function rangeQuery(range?: DateRange) {
  if (!range) return '';
  const params = new URLSearchParams({
    startDate: range.startDate.toISOString(),
    endDate: range.endDate.toISOString(),
  });
  return `?${params.toString()}`;
}

export function fetchSummary(credentials: Credentials, range?: DateRange, signal?: AbortSignal) {
  return getJson<DashboardSummary>(credentials, `/api/dashboard/summary${rangeQuery(range)}`, signal);
}

export function fetchCategorySpending(credentials: Credentials, range: DateRange, signal?: AbortSignal) {
  return getJson<CategorySpend[]>(credentials, `/api/dashboard/spending-by-category${rangeQuery(range)}`, signal);
}

export async function fetchRecentTransactions(credentials: Credentials, size: number, signal?: AbortSignal) {
  const data = await getJson<{ transactions: Transaction[]; total: number }>(
    credentials,
    `/api/transactions?page=1&size=${size}&sortBy=timestamp&sortOrder=desc`,
    signal,
  );
  return data.transactions;
}
