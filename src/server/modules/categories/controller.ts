import type { CategoryOption } from "@/common/types";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { toCategoryOption } from "./helpers";
import { categoryIdParamsSchema, categorySchema, subcategorySchema } from "./schemas";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategoriesForUser,
  resetCategoriesToDefault,
  updateCategory,
  updateSubcategory,
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
    return jsonError("Invalid JSON body", 400);
  }
}

async function parseId(context: RouteContext) {
  const params = await context.params;
  const parsed = categoryIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  return parsed.data.id;
}

export async function getCategories() {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await listCategoriesForUser({ userUuid: sessionData.userUuid });
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data.map((category): CategoryOption => toCategoryOption(category)));
}

export async function postCategory(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createCategory({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function patchCategory(request: Request, context: RouteContext) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const categoryId = await parseId(context);
  if (categoryId instanceof Response) {
    return categoryId;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateCategory({
    userUuid: sessionData.userUuid,
    categoryId,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function removeCategory(_request: Request, context: RouteContext) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const categoryId = await parseId(context);
  if (categoryId instanceof Response) {
    return categoryId;
  }

  const result = await deleteCategory({
    userUuid: sessionData.userUuid,
    categoryId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postSubcategory(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = subcategorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createSubcategory({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function patchSubcategory(request: Request, context: RouteContext) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const subcategoryId = await parseId(context);
  if (subcategoryId instanceof Response) {
    return subcategoryId;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = subcategorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateSubcategory({
    userUuid: sessionData.userUuid,
    subcategoryId,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function removeSubcategory(
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const subcategoryId = await parseId(context);
  if (subcategoryId instanceof Response) {
    return subcategoryId;
  }

  const result = await deleteSubcategory({
    userUuid: sessionData.userUuid,
    subcategoryId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postResetCategories() {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await resetCategoriesToDefault({ userUuid: sessionData.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
