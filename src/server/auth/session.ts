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
      logger.warn({
        event: "auth.failed",
        message: "Session user is missing",
      });
      return fail("UNAUTHORIZED");
    }

    return ok({ userUuid: session.user.uuid });
  } catch (error) {
    logger.error(
      {
        event: "auth.session_resolution_failed",
        message: "Failed to resolve session user",
      },
      error
    );
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
    logger.error(
      {
        event: "auth.page_session_resolution_failed",
        message: "Failed to resolve page session",
      },
      error
    );
    redirect("/login");
  }
}
