import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";
import { getUserDetails } from "@/common/server";

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

  let userCategories: { name: string; subcategories: string[] }[] = [];
  try {
    const userDetails = await getUserDetails(session.user.uuid);
    if (userDetails) {
      userCategories = userDetails.categories;
    }
  } catch (error) {
    console.error("Error fetching user categories for transactions page:", error);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Failed to load user categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <TransactionsClient userCategories={userCategories} />
    </div>
  );
}
