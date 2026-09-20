import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { parseTransactionMessage } from "@/common/sms-parser";
import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { createTransaction } from "@/server/modules/transactions/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";
import { matchAccountByName } from "@/server/modules/accounts/service";

import type { ImportSmsInput, ImportSmsOutcome } from "./types";

export async function importSmsTransaction(
  input: ImportSmsInput
): Promise<ServiceResult<ImportSmsOutcome, "UNPROCESSABLE" | "INTERNAL_ERROR">> {
  try {
    const parsed = parseTransactionMessage(input.message);
    if (!parsed?.amount || !parsed.recipient) {
      await prisma.rawMessage.create({
        data: {
          userUuid: input.userUuid,
          body: input.message,
          parseStatus: ParseStatus.UNPARSEABLE,
          parserName: null,
          failureReason: "Unable to extract amount or recipient",
          parsedPayload: parsed ?? undefined,
          locationRaw: input.location ?? null,
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
      timestamp: new Date(),
      reference: parsed.reference ?? null,
      accountUuid: accountMatch.data.accountUuid,
      locationRaw: input.location ?? null,
      source: TransactionSource.SMS,
      honorIgnoreRules: true,
    });

    if (!transaction.ok) {
      await prisma.rawMessage.create({
        data: {
          userUuid: input.userUuid,
          body: input.message,
          parseStatus: ParseStatus.FAILED,
          parserName: null,
          failureReason: "Transaction creation failed",
          parsedPayload: parsed,
          locationRaw: input.location ?? null,
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
          userUuid: input.userUuid,
          body: input.message,
          parseStatus: ParseStatus.IGNORED,
          parserName: null,
          parsedPayload: { ...parsed, ignoredByRuleUuid: transaction.data.ruleUuid },
          locationRaw: input.location ?? null,
        },
      });

      logger.info({
        event: "sms_import.ignored_by_rule",
        userId: input.userUuid,
        ruleUuid: transaction.data.ruleUuid,
        source: TransactionSource.SMS,
      });

      return ok(transaction.data);
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
        userUuid: input.userUuid,
        transactionId: createdTransaction.id,
        body: input.message,
        parseStatus: ParseStatus.PARSED,
        parserName: null,
        parsedPayload: parsed,
        locationRaw: input.location ?? null,
      },
    });

    logger.info({
      event: "sms_import.created",
      userId: input.userUuid,
      transactionId: createdTransaction.id,
      source: TransactionSource.SMS,
    });

    return ok(transaction.data);
  } catch (error) {
    logger.error(
      {
        event: "sms_import.db_failed",
        message: "Failed to import SMS transaction",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}
