import "server-only";

import {
  buildTransactionsApiSearchParams,
  buildTransactionsErrorQueryResult,
  buildTransactionsQueryResult,
  getTransactionsPageState,
  type TransactionsSearchParams,
} from "@/features/transactions/query-state";
import type { TransactionsPageInitialData } from "@/features/transactions/types";
import { getApiErrorMessage, getCategories, getTransactions } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

export async function getTransactionsPageData(
  searchParams: TransactionsSearchParams,
  options: { persistedRange?: string | null } = {}
): Promise<TransactionsPageInitialData> {
  await requirePageSessionUser();

  const categoriesPromise = getCategories().catch(() => []);
  const categoriesResponse = await categoriesPromise;
  const state = getTransactionsPageState(searchParams, {
    persistedRange: options.persistedRange,
    categories: categoriesResponse,
  });
  const params = buildTransactionsApiSearchParams(state.query);

  try {
    const transactions = await getTransactions(`?${params.toString()}`);

    return {
      initialTransactionsQuery: state.query,
      initialTransactionsData: buildTransactionsQueryResult({
        transactions,
      }),
      initialCategoriesData: categoriesResponse,
    };
  } catch (error) {
    return {
      initialTransactionsQuery: state.query,
      initialTransactionsData: buildTransactionsErrorQueryResult(
        state.query,
        getApiErrorMessage(error, "Transactions are temporarily unavailable. Try again in a moment.")
      ),
      initialCategoriesData: categoriesResponse,
    };
  }
}
