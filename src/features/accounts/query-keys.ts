export const accountsQueryKeys = {
  all: ["accounts"] as const,
  list: () => [...accountsQueryKeys.all, "list"] as const,
};
