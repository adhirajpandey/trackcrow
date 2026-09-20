import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function getLandingPageData() {
  try {
    const session = await getServerSession(authOptions);
    return { authenticated: Boolean(session?.user?.uuid) };
  } catch (error) {
    logger.error({
      event: "auth.landing_session_resolution_failed",
      message: "Failed to resolve landing page session",
    }, error);
    return { authenticated: false };
  }
}
