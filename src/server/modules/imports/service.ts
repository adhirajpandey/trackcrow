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
    { id: number; uuid: string },
    "UNAUTHORIZED" | "UNPROCESSABLE" | "INTERNAL_ERROR"
  >
> {
  if (!input.token) {
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
        return fail("UNPROCESSABLE");
      }
      return fail("INTERNAL_ERROR");
    }

    await prisma.rawMessage.create({
      data: {
        userUuid: tokenRecord.userUuid,
        transactionId: transaction.data.id,
        body: input.message,
        parseStatus: ParseStatus.PARSED,
        parserName: null,
        parsedPayload: parsed,
        locationRaw: input.location ?? null,
      },
    });

    return ok(transaction.data);
  } catch (error) {
    logger.error("importSmsTransaction - Failed to import SMS transaction", error as Error);
    return fail("INTERNAL_ERROR");
  }
}
