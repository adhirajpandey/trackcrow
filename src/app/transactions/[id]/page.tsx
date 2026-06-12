import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ViewTransactionForm,
  type ViewTransactionDefaults,
} from "./view-transaction-form";
import { ErrorMessage } from "@/components/error-message";
import { unwrapOrResponse } from "@/server/api/responses";
import { toCategoryOption } from "@/server/modules/categories/helpers";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { getTransactionById } from "@/server/modules/transactions/service";

export default async function ViewTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>; 
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to view this transaction" />
    );
  }

  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return (
      <ErrorMessage message="Invalid transaction id" />
    );
  }

  const [categoriesResult, transactionResult] = await Promise.all([
    listCategoriesForUser(session.user.uuid),
    getTransactionById(session.user.uuid, idNum),
  ]);

  const categoriesData = unwrapOrResponse(categoriesResult);
  const txn = unwrapOrResponse(transactionResult);

  if (categoriesData instanceof Response || txn instanceof Response) {
    return <ErrorMessage message="Transaction not found" />;
  }

  const defaults: ViewTransactionDefaults = {
    amount: txn.amount,
    recipientRaw: txn.recipientRaw,
    recipientName: txn.recipientName ?? txn.recipientDisplayName,
    categoryId: txn.categoryId ?? undefined,
    subcategoryId: txn.subcategoryId ?? undefined,
    type: txn.type,
    remarks: txn.remarks ?? "",
    sameAsRecipient:
      (txn.recipientName ?? txn.recipientDisplayName) === txn.recipientRaw,
    timestamp: new Date(txn.timestamp),
  };

  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Transaction</h1>
          <p className="text-muted-foreground leading-snug">
            View or edit this transaction.
          </p>
        </div>
      </div>
      <div className="py-2 md:py-4">
        <ViewTransactionForm
          categories={categoriesData.map(toCategoryOption)}
          defaults={defaults}
          transactionId={txn.id}
          searchParams={resolvedSearchParams}
        />
      </div>
    </div>
  );
}
