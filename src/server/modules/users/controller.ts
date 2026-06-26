import { jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { getMe } from "./service";

export async function getCurrentUser() {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await getMe({ userUuid: sessionData.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
