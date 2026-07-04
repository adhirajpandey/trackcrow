import { createHash, randomBytes } from "crypto";

import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type {
  CreateDeviceTokenInput,
  DeviceTokenDto,
  DeviceTokenListInput,
  RevokeDeviceTokenInput,
} from "./types";

export function hashDeviceToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildTokenPrefix(token: string) {
  return token.slice(0, 8);
}

function toDeviceTokenDto(token: {
  id?: number;
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): DeviceTokenDto {
  return {
    uuid: token.uuid,
    label: token.label,
    tokenPrefix: token.tokenPrefix,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
    revokedAt: token.revokedAt,
  };
}

export async function listDeviceTokens(
  input: DeviceTokenListInput
): Promise<ServiceResult<DeviceTokenDto[], "INTERNAL_ERROR">> {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userUuid: input.userUuid },
      select: {
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
    logger.error(
      {
        event: "device_token.list.db_failed",
        userId: input.userUuid,
        message: "Failed to list device tokens",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function createDeviceToken(
  input: CreateDeviceTokenInput
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
        userUuid: input.userUuid,
        label: input.label?.trim() || null,
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

    logger.info({
      event: "device_token.created",
      userId: input.userUuid,
      tokenId: tokenRecord.id,
    });

    return ok({
      token: plainToken,
      record: toDeviceTokenDto(tokenRecord),
    });
  } catch (error) {
    logger.error(
      {
        event: "device_token.create.db_failed",
        userId: input.userUuid,
        message: "Failed to create device token",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function revokeDeviceToken(
  input: RevokeDeviceTokenInput
): Promise<ServiceResult<{ revoked: true }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.deviceToken.findFirst({
      where: {
        uuid: input.tokenUuid,
        userUuid: input.userUuid,
        revokedAt: null,
      },
      select: { id: true, uuid: true },
    });

    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.deviceToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    logger.info({
      event: "device_token.revoked",
      userId: input.userUuid,
      tokenId: existing.id,
    });

    return ok({ revoked: true });
  } catch (error) {
    logger.error(
      {
        event: "device_token.revoke.db_failed",
        userId: input.userUuid,
        tokenUuid: input.tokenUuid,
        message: "Failed to revoke device token",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}
