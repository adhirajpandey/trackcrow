import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import {
  addRecipientAliasSchema,
  createRecipientSchema,
  listRecipientsQuerySchema,
  recipientIdParamsSchema,
  updateRecipientSchema,
} from "./schemas";
import {
  addRecipientAlias,
  createRecipient,
  getRecipient,
  listRecipients,
  updateRecipient,
} from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }
}

async function parseRecipientUuid(context: RouteContext, path: string) {
  const params = await context.params;
  const parsed = recipientIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400);
  }

  return parsed.data.id;
}

export async function getRecipients(request: Request) {
  const path = new URL(request.url).pathname;
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
    minTransactionCount: searchParams.get("minTransactionCount") ?? undefined,
    maxTransactionCount: searchParams.get("maxTransactionCount") ?? undefined,
    minTotalAmount: searchParams.get("minTotalAmount") ?? undefined,
    maxTotalAmount: searchParams.get("maxTotalAmount") ?? undefined,
  });
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await listRecipients({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postRecipient(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = createRecipientSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createRecipient({
    userUuid: sessionData.userUuid,
    displayName: parsed.data.displayName,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function getRecipientById(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const params = await context.params;
  const parsed = recipientIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400);
  }

  const result = await getRecipient({
    userUuid: sessionData.userUuid,
    recipientUuid: parsed.data.id,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function patchRecipient(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const recipientUuid = await parseRecipientUuid(context, path);
  if (recipientUuid instanceof Response) {
    return recipientUuid;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = updateRecipientSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateRecipient({
    userUuid: sessionData.userUuid,
    recipientUuid,
    ...parsed.data,
  });
  if (!result.ok && result.error === "CONFLICT") {
    return jsonError("A recipient with this name already exists", 409);
  }

  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postRecipientAlias(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const recipientUuid = await parseRecipientUuid(context, path);
  if (recipientUuid instanceof Response) {
    return recipientUuid;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = addRecipientAliasSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await addRecipientAlias({
    userUuid: sessionData.userUuid,
    recipientUuid,
    ...parsed.data,
  });
  if (!result.ok && result.error === "CONFLICT") {
    return jsonError("Alias belongs to another recipient", 409, {
      details: result.details,
    });
  }

  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, result.ok && result.data.status === "created" ? 201 : 200);
}
