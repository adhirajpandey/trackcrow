import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import {
  addRecipientIdentifierSchema,
  listRecipientsQuerySchema,
  recipientIdParamsSchema,
} from "./schemas";
import { addRecipientIdentifier, getRecipient, listRecipients } from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
}

async function parseRecipientId(context: RouteContext) {
  const params = await context.params;
  const parsed = recipientIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  return parsed.data.id;
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

export async function postRecipientIdentifier(
  request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const recipientId = await parseRecipientId(context);
  if (recipientId instanceof Response) {
    return recipientId;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = addRecipientIdentifierSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await addRecipientIdentifier({
    userUuid: sessionData.userUuid,
    recipientId,
    ...parsed.data,
  });
  if (!result.ok && result.error === "CONFLICT") {
    return jsonError("Identifier belongs to another recipient", 409, {
      details: result.details,
    });
  }

  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, result.ok && result.data.status === "created" ? 201 : 200);
}
