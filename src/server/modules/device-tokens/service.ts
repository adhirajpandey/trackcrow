import { createHash, randomBytes } from "crypto";

import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export type DeviceTokenDto = {
  id: number;
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export function hashDeviceToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildTokenPrefix(token: string) {
  return token.slice(0, 8);
}

function toDeviceTokenDto(token: {
  id: number;
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): DeviceTokenDto {
  return token;
}

export async function listDeviceTokens(
  userUuid: string
): Promise<ServiceResult<DeviceTokenDto[], "INTERNAL_ERROR">> {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userUuid },
      select: {
        id: true,
        uuid: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(tokens.map(toDeviceTokenDto));
  } catch (error) {
    logger.error("listDeviceTokens - Failed to list tokens", error as Error, {
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createDeviceToken(
  userUuid: string,
  label?: string
): Promise<
  ServiceResult<
    {
      token: string;
      record: DeviceTokenDto;
    },
    "INTERNAL_ERROR"
  >
> {
  try {
    const plainToken = randomBytes(24).toString("hex");
    const tokenRecord = await prisma.deviceToken.create({
      data: {
        userUuid,
        label: label?.trim() || null,
        tokenHash: hashDeviceToken(plainToken),
        tokenPrefix: buildTokenPrefix(plainToken),
      },
      select: {
        id: true,
        uuid: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });

    return ok({
      token: plainToken,
      record: toDeviceTokenDto(tokenRecord),
    });
  } catch (error) {
    logger.error("createDeviceToken - Failed to create token", error as Error, {
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function revokeDeviceToken(
  userUuid: string,
  tokenId: number
): Promise<ServiceResult<{ revoked: true }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.deviceToken.findFirst({
      where: {
        id: tokenId,
        userUuid,
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.deviceToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return ok({ revoked: true });
  } catch (error) {
    logger.error("revokeDeviceToken - Failed to revoke token", error as Error, {
      userUuid,
      tokenId,
    });
    return fail("INTERNAL_ERROR");
  }
}
