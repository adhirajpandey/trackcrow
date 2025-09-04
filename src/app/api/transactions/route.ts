import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { transactionReadArray } from "@/common/schemas";
import { getUserTransactions } from "@/common/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const data = await getUserTransactions(session.user.uuid);
  const validate = transactionReadArray.safeParse(data);
  if (!validate.success) {
    return NextResponse.json(
      { message: "Invalid data", issues: validate.error.issues },
      { status: 400 },
    );
  }
  return NextResponse.json({ transactions: validate.data });
}
