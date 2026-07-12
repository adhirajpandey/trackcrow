import "server-only";

import type { TransactionCreatePageInitialData } from "@/features/transactions/types";
import { getCategories, getRecipients } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

export async function getTransactionCreatePageData(): Promise<TransactionCreatePageInitialData> {
  await requirePageSessionUser();

  const [categories, recipients] = await Promise.all([
    getCategories().catch(() => []),
    getRecipients(
      "?page=1&size=10&sortBy=transactionCount&sortOrder=desc",
    ).catch(() => null),
  ]);

  return {
    initialCategoriesData: categories,
    initialRecipientsData: recipients?.recipients ?? [],
  };
}
