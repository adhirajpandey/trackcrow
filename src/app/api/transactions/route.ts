import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { transactionReadArray } from "@/common/schemas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const transactions = await prisma.transaction.findMany({
    where: { user_uuid: session.user.uuid },
    orderBy: { ist_datetime: "desc" },
    select: {
      id: true,
      amount: true,
      ist_datetime: true,
      createdAt: true,
      updatedAt: true,
      Category: {
        select: {
          name: true,
        },
      },
      // add other fields as needed
    },
  });

  // Convert Date fields to ISO string for zod validation
  const serialized = transactions.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    ist_datetime: t.ist_datetime ? t.ist_datetime.toISOString() : null,
    category: t.Category?.name ?? null,
  }));

  const validate = transactionReadArray.safeParse(serialized);
  if (!validate.success) {
    return NextResponse.json(
      { message: "Invalid data", issues: validate.error.issues },
      { status: 400 },
    );
  }
  return NextResponse.json({ transactions: validate.data });
}
