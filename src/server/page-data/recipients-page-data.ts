import "server-only";

import {
  buildRecipientsApiSearchParams,
  buildRecipientsErrorQueryResult,
  buildRecipientsQueryResult,
  getRecipientsPageState,
  type RecipientsSearchParams,
} from "@/features/recipients/query-state";
import type { RecipientsPageInitialData } from "@/features/recipients/types";
import { getApiErrorMessage, getRecipients } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

export async function getRecipientsPageData(
  searchParams: RecipientsSearchParams
): Promise<RecipientsPageInitialData> {
  await requirePageSessionUser();
  const state = getRecipientsPageState(searchParams);

  try {
    const params = buildRecipientsApiSearchParams(state.query);
    const recipients = await getRecipients(`?${params.toString()}`);

    return {
      initialRecipientsQuery: state.query,
      initialRecipientsData: buildRecipientsQueryResult({
        recipients,
      }),
    };
  } catch (error) {
    return {
      initialRecipientsQuery: state.query,
      initialRecipientsData: buildRecipientsErrorQueryResult(
        state.query,
        getApiErrorMessage(error, "Recipients are temporarily unavailable. Try again in a moment.")
      ),
    };
  }
}
