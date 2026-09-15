"use client";

import { useQuery } from "@tanstack/react-query";
import type { AccountOption } from "@/common/types";
import { apiGet } from "@/lib/api/client";
import { accountsQueryKeys } from "./query-keys";

export function getAccountsQueryData() {
  return apiGet<AccountOption[]>("/api/accounts");
}

export function useAccountsQuery(input: { initialData: AccountOption[] }) {
  return useQuery({ queryKey: accountsQueryKeys.list(), queryFn: getAccountsQueryData, initialData: input.initialData });
}
