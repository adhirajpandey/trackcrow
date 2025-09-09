import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { userReadSchema } from "@/common/schemas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUserPromise = prisma.user.findUnique({
      where: { uuid: session.user.uuid },
      select: {
        uuid: true,
        id: true,
        createdAt: true,
        Category: {
          select: {
            name: true,
            Subcategory: {
              select: { name: true },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    const firstTxnPromise = prisma.transaction.findFirst({
      where: { user_uuid: session.user.uuid },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
    });

    const [dbUser, firstTxn] = await Promise.all([
      dbUserPromise,
      firstTxnPromise,
    ]);

    if (!dbUser) {
      throw new Error("User not found");
    }

    const payload = {
      uuid: dbUser.uuid,
      id: dbUser.id,
      createdAt: dbUser.createdAt.toISOString(),
      firstTransactionDate: firstTxn?.timestamp.toISOString() ?? null,
      categories: dbUser.Category.map((c) => ({
        name: c.name,
        subcategories: c.Subcategory.map((s) => s.name),
      })),
    };

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
