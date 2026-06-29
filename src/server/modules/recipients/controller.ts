import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { listRecipientsQuerySchema, recipientIdParamsSchema } from "./schemas";
import { getRecipient, listRecipients } from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

export async function getRecipients(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = listRecipientsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    size: searchParams.get("size") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await listRecipients({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function getRecipientById(
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const params = await context.params;
  const parsed = recipientIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  const result = await getRecipient({
    userUuid: sessionData.userUuid,
    recipientId: parsed.data.id,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
