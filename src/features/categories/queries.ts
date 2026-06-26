"use client";

import { useQuery } from "@tanstack/react-query";

import type { CategoryOption } from "@/common/types";
import { apiGet } from "@/lib/api/client";

import { categoriesQueryKeys } from "./query-keys";

export function getCategoriesQueryData() {
  return apiGet<CategoryOption[]>("/api/categories");
}

export function useCategoriesQuery(input: { initialData: CategoryOption[] }) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(),
    queryFn: getCategoriesQueryData,
    initialData: input.initialData,
  });
}
