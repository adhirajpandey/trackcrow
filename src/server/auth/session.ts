import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export async function requireSessionUser(): Promise<
  ServiceResult<{ userUuid: string }, "UNAUTHORIZED" | "INTERNAL_ERROR">
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uuid) {
      return fail("UNAUTHORIZED");
    }

    return ok({ userUuid: session.user.uuid });
  } catch (error) {
    logger.error("requireSessionUser - Failed to resolve session", error as Error);
    return fail("INTERNAL_ERROR");
  }
}

export async function requirePageSessionUser(): Promise<{
  userUuid: string;
  name: string | null;
  email: string | null;
  image: string | null;
}> {
  const session = await getPageSession();
  if (!session?.user?.uuid) {
    redirect("/login");
  }

  return {
    userUuid: session.user.uuid,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
}

async function getPageSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    logger.error("requirePageSessionUser - Failed to resolve session", error as Error);
    redirect("/login");
  }
}
