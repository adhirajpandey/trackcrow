import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";

import { googleSignInSchema } from "./schemas";
import { getGoogleSignInConfig, revokeMobileSession, signInWithGoogle } from "./service";

export async function getGoogleConfig() {
  const data = unwrapOrResponse(getGoogleSignInConfig());
  return data instanceof Response ? data : jsonOk(data);
}

export async function postGoogleSignIn(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = googleSignInSchema.safeParse(body);
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const data = unwrapOrResponse(await signInWithGoogle({ idToken: parsed.data.idToken }));
  return data instanceof Response ? data : jsonOk(data);
}

export async function deleteMobileSession(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return jsonError("Unauthorized", 401);
  const data = unwrapOrResponse(await revokeMobileSession(token));
  return data instanceof Response ? data : new Response(null, { status: 204 });
}
