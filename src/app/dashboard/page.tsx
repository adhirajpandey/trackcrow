import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardClient } from "@/app/dashboard/components/dashboard-client";
import type { Transaction } from "@/common/schemas";
import { getUserTransactions } from "@/common/server";
import { getUserDetails } from "@/common/server";

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
  let userCategories: { name: string; subcategories: string[] }[] = [];
  try {
    // Populate category and subcategory names for dashboard summaries
    transactions = await getUserTransactions(session.user.uuid, true);
    const userDetails = await getUserDetails(session.user.uuid);
    if (userDetails) {
      userCategories = userDetails.categories;
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Failed to load transactions or user categories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <DashboardClient transactions={transactions} userCategories={userCategories} />
    </div>
  );
}
