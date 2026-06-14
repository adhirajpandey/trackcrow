import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { ensureDefaultCategoriesForUser } from "@/server/modules/categories/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { EnsureUserBootstrapInput, GetMeInput, MeDto } from "./types";

export async function ensureUserBootstrap(
  input: EnsureUserBootstrapInput
): Promise<ServiceResult<MeDto, "INTERNAL_ERROR">> {
  try {
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        image: input.image ?? null,
        provider: input.provider,
      },
      create: {
        email: input.email,
        name: input.name,
        image: input.image ?? null,
        provider: input.provider,
      },
      select: {
        uuid: true,
        id: true,
        email: true,
        name: true,
        image: true,
        subscription: true,
      },
    });

    const bootstrapResult = await ensureDefaultCategoriesForUser({ userUuid: user.uuid });
    if (!bootstrapResult.ok) {
      return bootstrapResult;
    }

    return ok(user);
  } catch (error) {
    logger.error("ensureUserBootstrap - Failed to bootstrap user", error as Error, {
      email: input.email,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getMe(
  input: GetMeInput
): Promise<ServiceResult<MeDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const user = await prisma.user.findUnique({
      where: { uuid: input.userUuid },
      select: {
        uuid: true,
        id: true,
        email: true,
        name: true,
        image: true,
        subscription: true,
      },
    });

    if (!user) {
      return fail("NOT_FOUND");
    }

    return ok(user);
  } catch (error) {
    logger.error("getMe - Failed to load current user", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}
