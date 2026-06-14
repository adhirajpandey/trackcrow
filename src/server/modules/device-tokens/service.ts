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
  input: DeviceTokenListInput
): Promise<ServiceResult<DeviceTokenDto[], "INTERNAL_ERROR">> {
  try {
    const tokens = await prisma.deviceToken.findMany({
      where: { userUuid: input.userUuid },
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
      userUuid: input.userUuid,
    });
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

    return ok({
      token: plainToken,
      record: toDeviceTokenDto(tokenRecord),
    });
  } catch (error) {
    logger.error("createDeviceToken - Failed to create token", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function revokeDeviceToken(
  input: RevokeDeviceTokenInput
): Promise<ServiceResult<{ revoked: true }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.deviceToken.findFirst({
      where: {
        id: input.tokenId,
        userUuid: input.userUuid,
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.deviceToken.update({
      where: { id: input.tokenId },
      data: { revokedAt: new Date() },
    });

    return ok({ revoked: true });
  } catch (error) {
    logger.error("revokeDeviceToken - Failed to revoke token", error as Error, {
      userUuid: input.userUuid,
      tokenId: input.tokenId,
    });
    return fail("INTERNAL_ERROR");
  }
}
