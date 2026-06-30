import "server-only";

import { notFound } from "next/navigation";

import type { RecipientDetailPageInitialData } from "@/features/recipients/types";
import { getCategories } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";
import { getRecipientDetail } from "@/server/modules/recipients/service";

import { buildRecipientDetailPageData } from "@/app/(app)/recipients/[id]/_components/recipient-detail-model";

export async function getRecipientDetailPageData(
  recipientId: number
): Promise<RecipientDetailPageInitialData> {
  const sessionUser = await requirePageSessionUser();
  const categoriesPromise = getCategories().catch(() => []);
  const result = await getRecipientDetail({
    userUuid: sessionUser.userUuid,
    recipientId,
  });

  if (!result.ok) {
    if (result.error === "NOT_FOUND") {
      notFound();
    }

    throw new Error("Recipient detail is temporarily unavailable.");
  }

  return {
    initialRecipientDetailData: buildRecipientDetailPageData(result.data),
    initialCategoriesData: await categoriesPromise,
  };
}
