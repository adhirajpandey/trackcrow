import type { RecipientsApiQuery } from "./types";

export const recipientsQueryKeys = {
  all: ["recipients"] as const,
  lists: ["recipients", "list"] as const,
  list: (query: RecipientsApiQuery) => ["recipients", "list", { query }] as const,
};
