import { TransactionSource } from "@/generated/prisma-rewrite";
import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionIdParamsSchema,
  updateTransactionCategorySchema,
  updateTransactionSchema,
} from "./schemas";
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  suggestTransactionCategory,
  updateTransactionCategory,
  updateTransaction,
} from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function parseJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }
}

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

async function parseTransactionUuid(context: RouteContext, path: string) {
  const params = await context.params;
  const parsed = transactionIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400);
  }

  return parsed.data.id;
}

export async function getTransactions(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const categoryParams = searchParams.getAll("category");
  const categoriesCsv = searchParams.get("categories");
  const subcategoryParams = searchParams.getAll("subcategory");
  const subcategoriesCsv = searchParams.get("subcategories");
  const categories = Array.from(
    new Set([
      ...categoryParams,
      ...(categoriesCsv
        ? categoriesCsv.split(",").map((value) => value.trim()).filter(Boolean)
        : []),
    ])
  );
  const subcategories = Array.from(
    new Set([
      ...subcategoryParams,
      ...(subcategoriesCsv
        ? subcategoriesCsv.split(",").map((value) => value.trim()).filter(Boolean)
        : []),
    ])
  );

  const parsed = listTransactionsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    size: searchParams.get("size") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    categories: categories.length > 0 ? categories : undefined,
    subcategories: subcategories.length > 0 ? subcategories : undefined,
  });
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await listTransactions({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postTransaction(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = createTransactionSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createTransaction({
    userUuid: sessionData.userUuid,
    ...parsed.data,
    source: TransactionSource.MANUAL,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function getTransaction(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionUuid = await parseTransactionUuid(context, path);
  if (transactionUuid instanceof Response) {
    return transactionUuid;
  }

  const result = await getTransactionById({
    userUuid: sessionData.userUuid,
    transactionUuid,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function patchTransaction(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionUuid = await parseTransactionUuid(context, path);
  if (transactionUuid instanceof Response) {
    return transactionUuid;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = updateTransactionSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateTransaction({
    transactionUuid,
    userUuid: sessionData.userUuid,
    ...parsed.data,
    source: TransactionSource.MANUAL,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function patchTransactionCategory(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionUuid = await parseTransactionUuid(context, path);
  if (transactionUuid instanceof Response) {
    return transactionUuid;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = updateTransactionCategorySchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateTransactionCategory({
    transactionUuid,
    userUuid: sessionData.userUuid,
    categoryUuid: parsed.data.categoryUuid ?? null,
    subcategoryUuid: parsed.data.subcategoryUuid,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function removeTransaction(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionUuid = await parseTransactionUuid(context, path);
  if (transactionUuid instanceof Response) {
    return transactionUuid;
  }

  const result = await deleteTransaction({
    userUuid: sessionData.userUuid,
    transactionUuid,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function getTransactionSuggestion(
  request: Request,
  context: RouteContext
) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionUuid = await parseTransactionUuid(context, path);
  if (transactionUuid instanceof Response) {
    return transactionUuid;
  }

  const result = await suggestTransactionCategory({
    userUuid: sessionData.userUuid,
    transactionUuid,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
