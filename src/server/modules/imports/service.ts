import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { parseTransactionMessage } from "@/common/sms-parser";
import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { hashDeviceToken } from "@/server/modules/device-tokens/service";
import { createTransaction } from "@/server/modules/transactions/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { ImportSmsInput } from "./types";

export async function importSmsTransaction(
  input: ImportSmsInput
): Promise<
  ServiceResult<
    { uuid: string },
    "UNAUTHORIZED" | "UNPROCESSABLE" | "INTERNAL_ERROR"
  >
> {
  if (!input.token) {
    logger.warn({
      event: "auth.failed",
      message: "SMS import rejected because the device token is missing",
    });
    return fail("UNAUTHORIZED");
  }

  try {
    const tokenRecord = await prisma.deviceToken.findFirst({
      where: {
        tokenHash: hashDeviceToken(input.token),
        revokedAt: null,
      },
      select: {
        id: true,
        userUuid: true,
      },
    });

    if (!tokenRecord) {
      logger.warn({
        event: "auth.failed",
        message: "SMS import rejected because the device token is invalid",
      });
      return fail("UNAUTHORIZED");
    }

    await prisma.deviceToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    });

    const parsed = parseTransactionMessage(input.message);
    if (!parsed?.amount || !parsed.recipient) {
      await prisma.rawMessage.create({
        data: {
          userUuid: tokenRecord.userUuid,
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
        userId: tokenRecord.userUuid,
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

    const transaction = await createTransaction({
      userUuid: tokenRecord.userUuid,
      amount: parsed.amount,
      recipientRaw: parsed.recipient,
      recipientName: parsed.recipient_name ?? null,
      type: parsed.type,
      remarks: null,
      timestamp: new Date(),
      reference: parsed.reference ?? null,
      accountLabel: parsed.account ?? null,
      locationRaw: input.location ?? null,
      source: TransactionSource.SMS,
    });

    if (!transaction.ok) {
      await prisma.rawMessage.create({
        data: {
          userUuid: tokenRecord.userUuid,
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
          userId: tokenRecord.userUuid,
          message: "SMS import produced an unprocessable transaction",
        });
        return fail("UNPROCESSABLE");
      }
      return fail("INTERNAL_ERROR");
    }

    const createdTransaction = await prisma.transaction.findFirst({
      where: {
        uuid: transaction.data.uuid,
        userUuid: tokenRecord.userUuid,
      },
      select: { id: true },
    });
    if (!createdTransaction) {
      return fail("INTERNAL_ERROR");
    }

    await prisma.rawMessage.create({
      data: {
        userUuid: tokenRecord.userUuid,
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
      userId: tokenRecord.userUuid,
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
