import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { RecipientDto, RecipientLookupInput, ResolveRecipientInput } from "./types";

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

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectIdentifierKind(value: string): RecipientIdentifierKind {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return RecipientIdentifierKind.UPI_ID;
  }

  if (/^[0-9]{10,}$/.test(trimmed.replace(/\D/g, ""))) {
    return RecipientIdentifierKind.PHONE;
  }

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 4) {
    return RecipientIdentifierKind.CARD_MERCHANT;
  }

  return RecipientIdentifierKind.TEXT;
}

export async function listRecipients(
  input: { userUuid: string }
): Promise<ServiceResult<RecipientDto[], "INTERNAL_ERROR">> {
  try {
    const recipients = await prisma.recipient.findMany({
      where: { userUuid: input.userUuid },
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
    logger.error("listRecipients - Failed to list recipients", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipient(
  input: RecipientLookupInput
): Promise<ServiceResult<RecipientDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { id: input.recipientId, userUuid: input.userUuid },
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
      userUuid: input.userUuid,
      recipientId: input.recipientId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function resolveRecipient(
  input: ResolveRecipientInput
): Promise<
  ServiceResult<
    {
      recipientId: number;
      displayName: string;
    },
    "INTERNAL_ERROR"
  >
> {
  const recipientRaw = input.recipientRaw.trim();
  const normalizedRaw = normalizeValue(recipientRaw);
  const displayName = (input.recipientName?.trim() || recipientRaw).trim();
  const normalizedName = normalizeValue(displayName);
  const identifierKind = detectIdentifierKind(recipientRaw);

  try {
    const existingIdentifier = await prisma.recipientIdentifier.findFirst({
      where: {
        userUuid: input.userUuid,
        kind: identifierKind,
        normalizedValue: normalizedRaw,
      },
      include: {
        recipient: true,
      },
    });

    if (existingIdentifier) {
      return ok({
        recipientId: existingIdentifier.recipientId,
        displayName: existingIdentifier.recipient.displayName,
      });
    }

    const existingRecipient = await prisma.recipient.findFirst({
      where: {
        userUuid: input.userUuid,
        normalizedName,
      },
    });

    const recipient =
      existingRecipient ??
      (await prisma.recipient.create({
        data: {
          userUuid: input.userUuid,
          displayName,
          normalizedName,
        },
      }));

    await prisma.recipientIdentifier.create({
      data: {
        userUuid: input.userUuid,
        recipientId: recipient.id,
        kind: identifierKind,
        value: recipientRaw,
        normalizedValue: normalizedRaw,
      },
    });

    return ok({
      recipientId: recipient.id,
      displayName: recipient.displayName,
    });
  } catch (error) {
    logger.error("resolveRecipient - Failed to resolve recipient", error as Error, {
      userUuid: input.userUuid,
      recipientRaw,
    });
    return fail("INTERNAL_ERROR");
  }
}
