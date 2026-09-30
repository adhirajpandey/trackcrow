import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { matchTransactionMessage } from "@/common/sms-parser";
import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { createTransaction } from "@/server/modules/transactions/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";
import { matchAccountByName } from "@/server/modules/accounts/service";

import type { ImportSmsInput, ImportSmsOutcome } from "./types";

// Fields shared by every raw message this import writes. Clients can opt out of storing the SMS
// text; the idempotency key lets a retried upload return the first attempt's outcome.
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

export async function importSmsTransaction(
  input: ImportSmsInput
): Promise<ServiceResult<ImportSmsOutcome, "UNPROCESSABLE" | "INTERNAL_ERROR">> {
  try {
    if (input.idempotencyKey) {
      const previous = await prisma.rawMessage.findFirst({
        where: { userUuid: input.userUuid, idempotencyKey: input.idempotencyKey },
        select: { parseStatus: true, transaction: { select: { uuid: true } } },
      });
      if (previous) {
        logger.info({
          event: "sms_import.duplicate",
          userId: input.userUuid,
          previousStatus: previous.parseStatus,
        });
        return ok({
          status: "DUPLICATE",
          previousStatus: previous.parseStatus,
          uuid: previous.transaction?.uuid ?? null,
        });
      }
    }

    const match = matchTransactionMessage(input.message);
    const parsed = match?.details ?? null;
    const parserName = match?.parserName ?? null;
    if (!parsed?.amount || !parsed.recipient) {
      await prisma.rawMessage.create({
        data: {
          ...rawMessageFields(input, parserName),
          parseStatus: ParseStatus.UNPARSEABLE,
          failureReason: "Unable to extract amount or recipient",
          parsedPayload: parsed ?? undefined,
        },
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

    const accountMatch = await matchAccountByName({
      userUuid: input.userUuid,
      name: parsed.account,
    });
    if (!accountMatch.ok) return fail("INTERNAL_ERROR");

    const transaction = await createTransaction({
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
    });

    if (!transaction.ok) {
      await prisma.rawMessage.create({
        data: {
          ...rawMessageFields(input, parserName),
          parseStatus: ParseStatus.FAILED,
          failureReason: "Transaction creation failed",
          parsedPayload: parsed,
        },
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
      await prisma.rawMessage.create({
        data: {
          ...rawMessageFields(input, parserName),
          parseStatus: ParseStatus.IGNORED,
          parsedPayload: { ...parsed, ignoredByRuleUuid: transaction.data.ruleUuid },
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

    const createdTransaction = await prisma.transaction.findFirst({
      where: {
        uuid: transaction.data.uuid,
        userUuid: input.userUuid,
      },
      select: { id: true },
    });
    if (!createdTransaction) {
      return fail("INTERNAL_ERROR");
    }

    await prisma.rawMessage.create({
      data: {
        ...rawMessageFields(input, parserName),
        transactionId: createdTransaction.id,
        parseStatus: ParseStatus.PARSED,
        parsedPayload: parsed,
      },
    });

    logger.info({
      event: "sms_import.created",
      userId: input.userUuid,
      transactionId: createdTransaction.id,
      source: TransactionSource.SMS,
    });

    return ok({ status: "CREATED", uuid: transaction.data.uuid });
  } catch {
    // Prisma errors may embed the raw SMS in their message. Do not log them.
    logger.error(
      {
        event: "sms_import.db_failed",
        message: "Failed to import SMS transaction",
      }
    );
    return fail("INTERNAL_ERROR");
  }
}
