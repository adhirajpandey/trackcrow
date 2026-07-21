import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import {
  createRuleSchema,
  listRulesQuerySchema,
  ruleUuidParamsSchema,
  updateRuleSchema,
} from "./schemas";
import { createRule, deleteRule, getRule, listRules, updateRule } from "./service";

type RuleRouteContext = { params: Promise<{ ruleUuid: string }> };

async function requireUserUuid() {
  return unwrapOrResponse(await requireSessionUser());
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }
}

async function parseRuleUuid(context: RuleRouteContext, path: string) {
  const parsed = ruleUuidParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }
  return parsed.data.ruleUuid;
}

function unwrapRuleMutation(result: Awaited<ReturnType<typeof createRule>>) {
  if (!result.ok && result.error === "RULE_RECIPIENT_CONFLICT") {
    return jsonError(
      "An enabled rule already exists for this recipient",
      409,
      { code: "RULE_RECIPIENT_CONFLICT", details: result.details }
    );
  }
  return unwrapOrResponse(result);
}

export async function getRules(request: Request) {
  const session = await requireUserUuid();
  if (session instanceof Response) return session;
  const params = new URL(request.url).searchParams;
  const parsed = listRulesQuerySchema.safeParse({
    page: params.get("page") ?? undefined,
    size: params.get("size") ?? undefined,
    q: params.get("q") ?? undefined,
    status: params.get("status") ?? undefined,
  });
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }
  const data = unwrapOrResponse(await listRules({ userUuid: session.userUuid, ...parsed.data }));
  return data instanceof Response ? data : jsonOk(data);
}

export async function postRule(request: Request) {
  const session = await requireUserUuid();
  if (session instanceof Response) return session;
  const json = await parseJson(request);
  if (json instanceof Response) return json;
  const parsed = createRuleSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }
  const data = unwrapRuleMutation(await createRule({ userUuid: session.userUuid, ...parsed.data }));
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function getRuleByUuid(request: Request, context: RuleRouteContext) {
  const session = await requireUserUuid();
  if (session instanceof Response) return session;
  const ruleUuid = await parseRuleUuid(context, new URL(request.url).pathname);
  if (ruleUuid instanceof Response) return ruleUuid;
  const data = unwrapOrResponse(await getRule({ userUuid: session.userUuid, ruleUuid }));
  return data instanceof Response ? data : jsonOk(data);
}

export async function patchRule(request: Request, context: RuleRouteContext) {
  const session = await requireUserUuid();
  if (session instanceof Response) return session;
  const ruleUuid = await parseRuleUuid(context, new URL(request.url).pathname);
  if (ruleUuid instanceof Response) return ruleUuid;
  const json = await parseJson(request);
  if (json instanceof Response) return json;
  const parsed = updateRuleSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }
  const data = unwrapRuleMutation(await updateRule({ userUuid: session.userUuid, ruleUuid, ...parsed.data }));
  return data instanceof Response ? data : jsonOk(data);
}

export async function removeRule(request: Request, context: RuleRouteContext) {
  const session = await requireUserUuid();
  if (session instanceof Response) return session;
  const ruleUuid = await parseRuleUuid(context, new URL(request.url).pathname);
  if (ruleUuid instanceof Response) return ruleUuid;
  const data = unwrapOrResponse(await deleteRule({ userUuid: session.userUuid, ruleUuid }));
  return data instanceof Response ? data : jsonOk(data);
}
