import { normalizeApiUrl, responseError, send, type Credentials } from './client';
import type { DebugEntry } from '../debug-log';
export type DiagnosticReport = {
  kind: 'report' | 'bank_request';
  appVersion: string;
  versionCode: number;
  device: Record<string, string | number | boolean | null>;
  note?: string;
  entries: DebugEntry[];
};
export async function sendDiagnosticReport(credentials: Credentials, report: DiagnosticReport) {
  const body = JSON.stringify(report);
  if (new TextEncoder().encode(body).byteLength > 262144)
    throw new Error('This report exceeds 256 KiB. Shorten the note and preview again.');
  const response = await send(`${normalizeApiUrl(credentials.apiUrl)}/api/mobile/diagnostics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' },
    body,
  });
  if (response.status === 201) return;
  if (response.status === 413)
    throw new Error('This report exceeds 256 KiB. Shorten the note and preview again.');
  if (response.status === 429) {
    const seconds = Number(response.headers.get('Retry-After'));
    const retry =
      Number.isFinite(seconds) && seconds > 0
        ? new Date(Date.now() + seconds * 1000).toLocaleString()
        : 'the next 24-hour window';
    throw new Error(`Report limit reached (10 per 24 hours). Try again after ${retry}.`);
  }
  throw await responseError(response);
}
