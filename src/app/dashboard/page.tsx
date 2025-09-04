import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DashboardClient } from "@/app/dashboard/components/dashboard-client";
import type { Transaction } from "@/common/schemas";
import { getUserTransactions } from "@/common/server";

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
    transactions = await getUserTransactions(session.user.uuid);
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
