import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { accountIdParamsSchema, accountSchema } from "./schemas";
import { createAccount, listAccounts, updateAccount } from "./service";

type RouteContext = { params: Promise<{ accountUuid: string }> };

async function userUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

async function body(request: Request) {
  try { return await request.json(); } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }
}

export async function getAccounts() {
  const session = await userUuid();
  if (session instanceof Response) return session;
  const result = await listAccounts({ userUuid: session.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postAccount(request: Request) {
  const session = await userUuid();
  if (session instanceof Response) return session;
  const json = await body(request);
  if (json instanceof Response) return json;
  const parsed = accountSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }
  const result = await createAccount({ userUuid: session.userUuid, name: parsed.data.name });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function patchAccount(request: Request, context: RouteContext) {
  const session = await userUuid();
  if (session instanceof Response) return session;
  const params = accountIdParamsSchema.safeParse(await context.params);
  if (!params.success) return jsonError("Invalid request", 400);
  const json = await body(request);
  if (json instanceof Response) return json;
  const parsed = accountSchema.safeParse(json);
  if (!parsed.success) return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  const result = await updateAccount({ userUuid: session.userUuid, accountUuid: params.data.accountUuid, name: parsed.data.name });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
