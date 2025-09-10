import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";
import { getUserDetails } from "@/common/server";
import { ErrorMessage } from "@/components/error-message";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to view this page" />
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
      <ErrorMessage message="Failed to load user categories." />
    );
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <TransactionsClient userCategories={userCategories} />
    </div>
  );
}
