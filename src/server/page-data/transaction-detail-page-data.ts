import "server-only";

import { notFound } from "next/navigation";

import type { TransactionDetailPageInitialData } from "@/features/transactions/types";
import {
  getTransaction,
  getCategories,
  getAccounts,
  isInternalApiError,
} from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

export async function getTransactionDetailPageData(
  transactionUuid: string
): Promise<TransactionDetailPageInitialData> {
  await requirePageSessionUser();

  const categoriesPromise = getCategories().catch(() => []);
  const accountsPromise = getAccounts().catch(() => []);

  try {
    const transaction = await getTransaction(transactionUuid);

    return {
      transactionUuid,
      initialTransactionData: transaction,
      initialCategoriesData: await categoriesPromise,
      initialAccountsData: await accountsPromise,
    };
  } catch (error) {
    if (isInternalApiError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
