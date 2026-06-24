import "server-only";

import {
  buildRecipientsErrorQueryResult,
  getRecipientsPageState,
  type RecipientsSearchParams,
} from "@/features/recipients/query-state";
import type { RecipientsPageInitialData } from "@/features/recipients/types";
import { requirePageSessionUser } from "@/server/auth/session";
import { listRecipients } from "@/server/modules/recipients/service";

export async function getRecipientsPageData(
  searchParams: RecipientsSearchParams
): Promise<RecipientsPageInitialData> {
  const sessionUser = await requirePageSessionUser();
  const state = getRecipientsPageState(searchParams);
  const result = await listRecipients({ userUuid: sessionUser.userUuid });

  if (!result.ok) {
    return {
      initialRecipientsQuery: state.query,
      initialRecipientsData: buildRecipientsErrorQueryResult(
        "Recipients are temporarily unavailable. Try again in a moment."
      ),
    };
  }

  return {
    initialRecipientsQuery: state.query,
    initialRecipientsData: {
      status: "ready",
      message: null,
      recipients: result.data,
    },
  };
}
