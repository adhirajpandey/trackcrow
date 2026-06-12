import { z } from "zod";

import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import {
  deleteCategory,
  updateCategory,
} from "@/server/modules/categories/mutations";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

async function parseCategoryId(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return Number(params.id);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const categoryId = await parseCategoryId(context);
  if (!Number.isFinite(categoryId)) {
    return jsonError("Invalid request", 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateCategory(sessionData.userUuid, categoryId, parsed.data);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const categoryId = await parseCategoryId(context);
  if (!Number.isFinite(categoryId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await deleteCategory(sessionData.userUuid, categoryId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
