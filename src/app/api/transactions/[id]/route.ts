import { z } from "zod";

import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@/server/modules/transactions/service";

const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipientRaw: z.string().trim().min(1),
  recipientName: z.string().trim().min(1).optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  subcategoryId: z.coerce.number().int().positive().optional().nullable(),
  type: z.nativeEnum(TransactionType),
  remarks: z.string().optional().nullable(),
  timestamp: z.coerce.date(),
  reference: z.string().optional().nullable(),
  accountLabel: z.string().optional().nullable(),
  locationRaw: z.string().optional().nullable(),
});

async function parseTransactionId(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return Number(params.id);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const transactionId = await parseTransactionId(context);
  if (!Number.isFinite(transactionId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await getTransactionById(sessionData.userUuid, transactionId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
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

  const transactionId = await parseTransactionId(context);
  if (!Number.isFinite(transactionId)) {
    return jsonError("Invalid request", 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = updateTransactionSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await updateTransaction({
    id: transactionId,
    userUuid: sessionData.userUuid,
    ...parsed.data,
    source: TransactionSource.MANUAL,
  });
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

  const transactionId = await parseTransactionId(context);
  if (!Number.isFinite(transactionId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await deleteTransaction(sessionData.userUuid, transactionId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
