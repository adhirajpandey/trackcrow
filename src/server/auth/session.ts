import { getServerSession } from "next-auth";

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
