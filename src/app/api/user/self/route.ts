import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserDetails } from "@/common/server";
import { z } from "zod";
import { userReadSchema } from "@/common/schemas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDetails = await getUserDetails(session.user.uuid);

    if (!userDetails) {
      throw new Error("User not found");
    }

    const payload = userDetails;

    return NextResponse.json(userReadSchema.parse(payload), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
