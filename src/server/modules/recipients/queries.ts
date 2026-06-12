import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export type RecipientDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
};

function toRecipientDto(record: {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
  _count: { transactions: number };
}): RecipientDto {
  return {
    id: record.id,
    uuid: record.uuid,
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    transactionCount: record._count.transactions,
    identifiers: record.identifiers,
  };
}

export async function listRecipients(
  userUuid: string
): Promise<ServiceResult<RecipientDto[], "INTERNAL_ERROR">> {
  try {
    const recipients = await prisma.recipient.findMany({
      where: { userUuid },
      include: {
        identifiers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            uuid: true,
            kind: true,
            value: true,
            normalizedValue: true,
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ displayName: "asc" }],
    });

    return ok(recipients.map(toRecipientDto));
  } catch (error) {
    logger.error("listRecipients - Failed to list recipients", error as Error, { userUuid });
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipient(
  userUuid: string,
  recipientId: number
): Promise<ServiceResult<RecipientDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { id: recipientId, userUuid },
      include: {
        identifiers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            uuid: true,
            kind: true,
            value: true,
            normalizedValue: true,
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!recipient) {
      return fail("NOT_FOUND");
    }

    return ok(toRecipientDto(recipient));
  } catch (error) {
    logger.error("getRecipient - Failed to get recipient", error as Error, {
      userUuid,
      recipientId,
    });
    return fail("INTERNAL_ERROR");
  }
}
