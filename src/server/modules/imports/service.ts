import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { matchTransactionMessage } from "@/common/sms-parser";
import {
  ParseStatus,
  TransactionSource,
  type Prisma,
} from "@/generated/prisma-rewrite";
import { createTransaction } from "@/server/modules/transactions/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";
import { matchAccountByName } from "@/server/modules/accounts/service";

import type { ImportSmsInput, ImportSmsOutcome } from "./types";

/** Applies receipt metadata and body-storage policy to every raw-message outcome. */
function rawMessageFields(input: ImportSmsInput, parserName: string | null) {
  return {
    userUuid: input.userUuid,
    body: input.storeMessageBody === false ? null : input.message,
    parserName,
    locationRaw: input.location ?? null,
    ...(input.sender ? { sender: input.sender } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    ...(input.timestamp ? { receivedAt: input.timestamp } : {}),
  };
}

/** Commits keyed uploads atomically; transient failures leave the key available for retry. */
export async function importSmsTransaction(
  input: ImportSmsInput,
): Promise<
  ServiceResult<ImportSmsOutcome, "UNPROCESSABLE" | "INTERNAL_ERROR">
> {
  try {
    if (input.idempotencyKey) {
      const previous = await findDuplicate(input);
      if (previous) return previous;

      return await prisma.$transaction(async (db) => {
        // The unique insert reserves this occurrence before parsing or creating a transaction.
        // Its temporary status is never visible outside this database transaction.
        const reserved = await db.rawMessage.create({
          data: {
            ...rawMessageFields(input, null),
            parseStatus: ParseStatus.FAILED,
          },
          select: { id: true },
        });
        const result = await processSms(input, db, reserved.id);
        // Roll back transient failures so a later retry can claim the same key.
        if (!result.ok && result.error === "INTERNAL_ERROR")
          throw new Error("SMS import failed");
        return result;
      });
    }
    return await processSms(input, prisma);
  } catch (error) {
    if (
      input.idempotencyKey &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      // A competing insert waits for the winning transaction to commit before raising P2002.
      // Look up its outcome outside our rolled-back transaction.
      try {
        const previous = await findDuplicate(input);
        if (previous) return previous;
      } catch {
        /* Report a sanitized database failure below. */
      }
    }
    // Prisma errors may embed the raw SMS in their message. Do not log them.
    logger.error({
      event: "sms_import.db_failed",
      message: "Failed to import SMS transaction",
    });
    return fail("INTERNAL_ERROR");
  }
}

/** Reads a committed outcome, including after a competing key reservation finishes. */
async function findDuplicate(input: ImportSmsInput) {
  const previous = await prisma.rawMessage.findFirst({
    where: { userUuid: input.userUuid, idempotencyKey: input.idempotencyKey },
    select: { parseStatus: true, transaction: { select: { uuid: true } } },
  });
  return previous
    ? ok({
        status: "DUPLICATE" as const,
        previousStatus: previous.parseStatus,
        uuid: previous.transaction?.uuid ?? null,
      })
    : null;
}

/** Parses and records an outcome using the caller's database transaction when supplied. */
async function processSms(
  input: ImportSmsInput,
  db: Prisma.TransactionClient,
  rawMessageId?: number,
): Promise<
  ServiceResult<ImportSmsOutcome, "UNPROCESSABLE" | "INTERNAL_ERROR">
> {
  async function persistRaw(data: Prisma.RawMessageUncheckedCreateInput) {
    if (rawMessageId !== undefined) {
      await db.rawMessage.update({ where: { id: rawMessageId }, data });
    } else {
      await db.rawMessage.create({ data });
    }
  }

  const match = matchTransactionMessage(input.message);
  const parsed = match?.details ?? null;
  const parserName = match?.parserName ?? null;
  if (!parsed?.amount || !parsed.recipient) {
    await persistRaw({
      ...rawMessageFields(input, parserName),
      parseStatus: ParseStatus.UNPARSEABLE,
      failureReason: "Unable to extract amount or recipient",
      parsedPayload: parsed ?? undefined,
    });

    logger.warn({
      event: "sms_import.parse_failed",
      userId: input.userUuid,
      hasAmount: Boolean(parsed?.amount),
      hasRecipient: Boolean(parsed?.recipient),
      message: "SMS import could not extract required fields",
    });

    return fail("UNPROCESSABLE", {
      missing: {
        amount: !parsed?.amount,
        recipient: !parsed?.recipient,
      },
      parsedDetails: parsed,
    });
  }

  const accountMatch = await matchAccountByName(
    {
      userUuid: input.userUuid,
      name: parsed.account,
    },
    db,
  );
  if (!accountMatch.ok) return fail("INTERNAL_ERROR");

  const transaction = await createTransaction(
    {
      userUuid: input.userUuid,
      amount: parsed.amount,
      recipientRaw: parsed.recipient,
      recipientName: parsed.recipient_name ?? null,
      type: parsed.type,
      remarks: null,
      timestamp: input.timestamp ?? new Date(),
      reference: parsed.reference ?? null,
      accountUuid: accountMatch.data.accountUuid,
      locationRaw: input.location ?? null,
      source: TransactionSource.SMS,
      honorIgnoreRules: true,
    },
    db,
  );

  if (!transaction.ok) {
    await persistRaw({
      ...rawMessageFields(input, parserName),
      parseStatus: ParseStatus.FAILED,
      failureReason: "Transaction creation failed",
      parsedPayload: parsed,
    });
    if (transaction.error === "VALIDATION_ERROR") {
      logger.warn({
        event: "sms_import.transaction_failed",
        userId: input.userUuid,
        message: "SMS import produced an unprocessable transaction",
      });
      return fail("UNPROCESSABLE");
    }
    return fail("INTERNAL_ERROR");
  }

  if (transaction.data.ignored) {
    await persistRaw({
      ...rawMessageFields(input, parserName),
      parseStatus: ParseStatus.IGNORED,
      parsedPayload: {
        ...parsed,
        ignoredByRuleUuid: transaction.data.ruleUuid,
      },
    });

    logger.info({
      event: "sms_import.ignored_by_rule",
      userId: input.userUuid,
      ruleUuid: transaction.data.ruleUuid,
      source: TransactionSource.SMS,
    });

    return ok({ status: "IGNORED", ruleUuid: transaction.data.ruleUuid });
  }

  const createdTransaction = await db.transaction.findFirst({
    where: {
      uuid: transaction.data.uuid,
      userUuid: input.userUuid,
    },
    select: { id: true },
  });
  if (!createdTransaction) {
    return fail("INTERNAL_ERROR");
  }

  await persistRaw({
    ...rawMessageFields(input, parserName),
    transactionId: createdTransaction.id,
    parseStatus: ParseStatus.PARSED,
    parsedPayload: parsed,
  });

  logger.info({
    event: "sms_import.created",
    userId: input.userUuid,
    transactionId: createdTransaction.id,
    source: TransactionSource.SMS,
  });

  return ok({ status: "CREATED", uuid: transaction.data.uuid });
}
