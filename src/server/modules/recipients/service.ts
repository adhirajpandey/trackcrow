import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

type ResolveRecipientInput = {
  userUuid: string;
  recipientRaw: string;
  recipientName?: string | null;
};

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
