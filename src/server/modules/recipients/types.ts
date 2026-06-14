export type RecipientDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
};

export type ResolveRecipientInput = {
  userUuid: string;
  recipientRaw: string;
  recipientName?: string | null;
};

export type RecipientLookupInput = {
  userUuid: string;
  recipientId: number;
};
