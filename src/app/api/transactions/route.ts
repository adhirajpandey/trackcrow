import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || !session.user?.uuid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Fetch all transactions for the logged-in user
  const transactions = await prisma.transaction.findMany({
    where: { user_uuid: session.user.uuid },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json({ transactions });
}
