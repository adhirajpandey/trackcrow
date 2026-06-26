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
  searchParams: TransactionsSearchParams
): Promise<TransactionsPageInitialData> {
  await requirePageSessionUser();

  const state = getTransactionsPageState(searchParams);
  const params = buildTransactionsApiSearchParams(state.query);

  const categoriesPromise = getCategories().catch(() => []);

  try {
    const [transactions, categoriesResponse] = await Promise.all([
      getTransactions(`?${params.toString()}`),
      categoriesPromise,
    ]);

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
      initialCategoriesData: await categoriesPromise,
    };
  }
}
