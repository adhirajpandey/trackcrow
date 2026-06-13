import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toUserCategorySummary } from "@/common/types";
import { getCategories } from "@/lib/internal-api";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";
import type { UserCategorySummary } from "@/common/types";
import { ErrorMessage } from "@/components/error-message";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to view this page" />
    );
  }

  let userCategories: UserCategorySummary[] = [];
  try {
    const categories = await getCategories();
    userCategories = categories.map(toUserCategorySummary);
  } catch {
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
