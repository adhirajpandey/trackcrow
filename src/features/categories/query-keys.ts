export const categoriesQueryKeys = {
  all: ["categories"] as const,
  list: () => ["categories", "list"] as const,
};
