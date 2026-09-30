import { getJson, postJson, patchJson, type Credentials } from './client';
export type Account = { uuid: string; name: string };
export const fetchAccounts = (c: Credentials, signal?: AbortSignal) => getJson<Account[]>(c, '/api/accounts', signal);
export const createAccount = (c: Credentials, name: string) => postJson<Account>(c, '/api/accounts', { name });
export const updateAccount = (c: Credentials, id: string, name: string) =>
  patchJson<Account>(c, `/api/accounts/${encodeURIComponent(id)}`, { name });
