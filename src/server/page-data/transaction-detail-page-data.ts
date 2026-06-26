import "server-only";

import { notFound } from "next/navigation";

import type { TransactionDetailPageInitialData } from "@/features/transactions/types";
import {
  getTransaction,
  getCategories,
  isInternalApiError,
} from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

export async function getTransactionDetailPageData(
  transactionId: number
): Promise<TransactionDetailPageInitialData> {
  await requirePageSessionUser();

  const categoriesPromise = getCategories().catch(() => []);

  try {
    const transaction = await getTransaction(transactionId);

    return {
      transactionId,
      initialTransactionData: transaction,
      initialCategoriesData: await categoriesPromise,
    };
  } catch (error) {
    if (isInternalApiError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
