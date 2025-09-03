import { transactionRead } from "@/common/schemas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Transaction } from "@/common/schemas";
import { z } from "zod";
import { DashboardClient } from "@/components/dashboard-client";
import prisma from "@/lib/prisma";

// Main dashboard page component
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Please sign in to view this page</p>
        </div>
      </div>
    );
  }
  let transactions: Transaction[] = [];
  try {
    const txns = await prisma.transaction.findMany({
      where: { user_uuid: session.user.uuid },
      orderBy: { timestamp: "desc" },
    });
    // Convert Date fields to ISO string for zod validation
    const serialized = txns.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      ist_datetime: t.ist_datetime ? t.ist_datetime.toISOString() : null,
    }));
    const validate = z.array(transactionRead).safeParse(serialized);
    if (validate.success) {
      transactions = validate.data;
    }
  } catch {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Failed to load transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <DashboardClient transactions={transactions} />
    </div>
  );
}
