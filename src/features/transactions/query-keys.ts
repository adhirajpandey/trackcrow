import type { TransactionsApiQuery } from "./types";

export const transactionsQueryKeys = {
  all: ["transactions"] as const,
  lists: ["transactions", "list"] as const,
  list: (query: TransactionsApiQuery) => ["transactions", "list", { query }] as const,
  details: ["transactions", "detail"] as const,
  detail: (transactionId: number) => ["transactions", "detail", transactionId] as const,
};
