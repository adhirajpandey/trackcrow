import { z } from "zod";

import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import {
  createTransaction,
  listTransactions,
} from "@/server/modules/transactions/service";

const createTransactionSchema = z.object({
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

export async function GET(request: Request) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await listTransactions(
    sessionData.userUuid,
    new URL(request.url).searchParams
  );
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
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
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data, 201);
}
