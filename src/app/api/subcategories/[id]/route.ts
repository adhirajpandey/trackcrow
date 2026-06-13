import { z } from "zod";

import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import {
  deleteSubcategory,
  updateSubcategory,
} from "@/server/modules/categories/mutations";

const subcategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.coerce.number().int().positive(),
});

async function parseSubcategoryId(context: { params: Promise<{ id: string }> }) {
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

  const subcategoryId = await parseSubcategoryId(context);
  if (!Number.isFinite(subcategoryId)) {
    return jsonError("Invalid request", 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = subcategorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateSubcategory(sessionData.userUuid, subcategoryId, parsed.data);
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

  const subcategoryId = await parseSubcategoryId(context);
  if (!Number.isFinite(subcategoryId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await deleteSubcategory(sessionData.userUuid, subcategoryId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
