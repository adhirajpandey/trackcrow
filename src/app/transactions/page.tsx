import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TransactionsClient } from "@/app/transactions/components/transactions-client";
import type { UserCategorySummary } from "@/common/types";
import { ErrorMessage } from "@/components/error-message";
import { unwrapOrResponse } from "@/server/api/responses";
import { toUserCategorySummary } from "@/server/modules/categories/helpers";
import { listCategoriesForUser } from "@/server/modules/categories/service";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to view this page" />
    );
  }

  let userCategories: UserCategorySummary[] = [];
  try {
    const result = await listCategoriesForUser(session.user.uuid);
    const data = unwrapOrResponse(result);
    if (data instanceof Response) {
      throw new Error("Failed to load categories");
    }
    userCategories = data.map(toUserCategorySummary);
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
