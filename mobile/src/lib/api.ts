export type Credentials = { apiUrl: string; token: string };

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
  if (status === 401) return new ApiError('The access token is invalid or revoked. Update it in Settings.', status);
  if (status === 403) return new ApiError('The access token needs the transactions:read scope.', status);
  if (status === 503) return new ApiError('TrackCrow is temporarily unavailable. Try again shortly.', status);
  return new ApiError(`TrackCrow returned an error (HTTP ${status}).`, status);
}

async function getJson<T>(credentials: Credentials, path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  let response: Response;
  try {
    response = await fetch(`${credentials.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${credentials.token}` },
      signal: controller.signal,
      credentials: 'omit',
    });
  } catch {
    throw new ApiError('Could not reach TrackCrow. Check your connection and server URL.', null);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
  if (!response.ok) throw errorForStatus(response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
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
