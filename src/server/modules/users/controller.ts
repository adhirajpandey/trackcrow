import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { requireSessionOrTokenUser } from "@/server/auth/request-user";
import { jsonOk, unwrapOrResponse } from "@/server/api/responses";

import { getMe } from "./service";

export async function getCurrentUser(request: Request) {
  const sessionData = await requireSessionOrTokenUser(request, ApiTokenScope.TRANSACTIONS_READ);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await getMe({ userUuid: sessionData.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
