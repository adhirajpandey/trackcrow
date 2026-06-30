import { TransactionSource } from "@/generated/prisma-rewrite";
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
    return jsonError("Invalid JSON body", 400);
  }
}

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

async function parseTransactionId(context: RouteContext) {
  const params = await context.params;
  const parsed = transactionIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  return parsed.data.id;
}

export async function getTransactions(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const categoryParams = searchParams.getAll("category");
  const categoriesCsv = searchParams.get("categories");
  const categories = Array.from(
    new Set([
      ...categoryParams,
      ...(categoriesCsv
        ? categoriesCsv.split(",").map((value) => value.trim()).filter(Boolean)
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
  });
  if (!parsed.success) {
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
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (transactionId instanceof Response) {
    return transactionId;
  }

  const result = await getTransactionById({
    userUuid: sessionData.userUuid,
    transactionId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function patchTransaction(
  request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (transactionId instanceof Response) {
    return transactionId;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = updateTransactionSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateTransaction({
    transactionId,
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
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (transactionId instanceof Response) {
    return transactionId;
  }

  const json = await parseJsonBody(request);
  if (json instanceof Response) {
    return json;
  }

  const parsed = updateTransactionCategorySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateTransactionCategory({
    transactionId,
    userUuid: sessionData.userUuid,
    categoryId: parsed.data.categoryId ?? null,
    subcategoryId: parsed.data.subcategoryId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function removeTransaction(
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (transactionId instanceof Response) {
    return transactionId;
  }

  const result = await deleteTransaction({
    userUuid: sessionData.userUuid,
    transactionId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function getTransactionSuggestion(
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (transactionId instanceof Response) {
    return transactionId;
  }

  const result = await suggestTransactionCategory({
    userUuid: sessionData.userUuid,
    transactionId,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
