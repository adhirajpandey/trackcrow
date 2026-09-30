import { getJson, postJson, patchJson, queryString, type Credentials, type Page } from './client';
export type Alias = { uuid: string; aliasType: string; value: string; normalizedValue: string };
export type Recipient = {
  uuid: string;
  displayName: string;
  normalizedName: string;
  note: string | null;
  transactionCount: number;
  totalAmount: number;
  aliases: Alias[];
};
export type RecipientFilters = {
  page?: number;
  size?: number;
  q?: string;
  sortBy?: 'displayName' | 'transactionCount' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  minTransactionCount?: number;
  maxTransactionCount?: number;
  minTotalAmount?: number;
  maxTotalAmount?: number;
};
export type AliasInput = {
  value: string;
  aliasType?: 'AUTO' | 'UPI_ID' | 'CARD_MERCHANT' | 'TEXT';
  transfer?: boolean;
};
export type AliasResult = {
  status: 'created' | 'already_linked' | 'moved';
  alias: Alias;
  movedTransactionCount: number;
  movedTransactionTotalAmount: number;
  deletedSourceRecipient: boolean;
};
export const fetchRecipients = (c: Credentials, filters: RecipientFilters = {}, signal?: AbortSignal) =>
  getJson<Page & { recipients: Recipient[] }>(c, `/api/recipients${queryString(filters)}`, signal);
export const fetchRecipient = (c: Credentials, id: string, signal?: AbortSignal) =>
  getJson<Recipient>(c, `/api/recipients/${encodeURIComponent(id)}`, signal);
export const createRecipient = (c: Credentials, displayName: string) =>
  postJson<Pick<Recipient, 'uuid' | 'displayName' | 'normalizedName'>>(c, '/api/recipients', { displayName });
export const updateRecipient = (c: Credentials, id: string, input: { displayName?: string; note?: string | null }) =>
  patchJson<Recipient>(c, `/api/recipients/${encodeURIComponent(id)}`, input);
export const addRecipientAlias = (c: Credentials, id: string, input: AliasInput) =>
  postJson<AliasResult>(c, `/api/recipients/${encodeURIComponent(id)}/aliases`, input);
