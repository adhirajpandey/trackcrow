import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";

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

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <TransactionsClient />
    </div>
  );
}
