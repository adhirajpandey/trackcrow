import { AddTransactionForm } from "./add-transaction-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ErrorMessage } from "@/components/error-message";
import { unwrapOrResponse } from "@/server/api/responses";
import { toCategoryOption } from "@/server/modules/categories/helpers";
import { listCategoriesForUser } from "@/server/modules/categories/service";

export default async function AddTransactionPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to add a transaction" />
    );
  }

  const categoriesResult = await listCategoriesForUser(session.user.uuid);
  const categoriesData = unwrapOrResponse(categoriesResult);
  if (categoriesData instanceof Response) {
    return <ErrorMessage message="Failed to load categories" />;
  }

  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Add Transaction</h1>
          <p className="text-muted-foreground leading-snug">
            Add a manual transaction to your records.
          </p>
        </div>
      </div>
      <div className="py-2 md:py-4">
        <AddTransactionForm categories={categoriesData.map(toCategoryOption)} />
      </div>
    </div>
  );
}
