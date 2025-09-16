import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserDetails } from "@/common/server";
import { z } from "zod";
import { userReadSchema } from "@/common/schemas";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    logger.info("GET /api/user/self - Starting user data fetch");
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
      logger.info("GET /api/user/self - Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("GET /api/user/self - User authenticated", {
      userUuid: session.user.uuid,
      userEmail: session.user.email
    });

    const userDetails = await getUserDetails(session.user.uuid);

    if (!userDetails) {
      logger.error("GET /api/user/self - User not found in database", undefined, {
        userUuid: session.user.uuid
      });
      throw new Error("User not found");
    }

    const payload = userDetails;
    const validatedPayload = userReadSchema.parse(payload);

    logger.info("GET /api/user/self - User data fetched successfully", {
      userUuid: session.user.uuid,
      categoryCount: userDetails.categories.length
    });

    return NextResponse.json(validatedPayload, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("GET /api/user/self - Validation error", undefined, {
        validationErrors: error.issues
      });
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    logger.error("GET /api/user/self - Unexpected error", error as Error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
