import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Transaction } from "@/common/schemas";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";
import { getUserTransactions } from "@/common/server";

export default async function TransactionsPage() {
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
    // Populate category and subcategory names for display
    transactions = await getUserTransactions(session.user.uuid, true);
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
      <TransactionsClient transactions={transactions} />
    </div>
  );
}
