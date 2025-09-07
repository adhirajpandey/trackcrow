import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { ViewTransactionForm, type ViewTransactionDefaults } from "./view-transaction-form";

export default async function ViewTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.uuid) {
    return (
      <div className="container mx-auto p-6 lg:pl-8 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Please sign in to view this transaction</p>
        </div>
      </div>
    );
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) {
    return (
      <div className="container mx-auto p-6 lg:pl-8 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Invalid transaction id</p>
        </div>
      </div>
    );
  }

  const [categories, txn] = await Promise.all([
    prisma.category.findMany({
      where: { user_uuid: session.user.uuid },
      include: { Subcategory: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findFirst({
      where: { id: idNum, user_uuid: session.user.uuid },
    }),
  ]);

  if (!txn) {
    return (
      <div className="container mx-auto p-6 lg:pl-8 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Transaction not found</p>
        </div>
      </div>
    );
  }

  const amount =
    typeof (txn as { amount: { toNumber: () => number } }).amount?.toNumber === "function"
      ? (txn as { amount: { toNumber: () => number } }).amount.toNumber()
      : Number((txn as { amount: number }).amount);
  const defaults: ViewTransactionDefaults = {
    amount,
    recipient: txn.recipient,
    recipient_name: txn.recipient_name ?? "",
    categoryId: (txn.categoryId ?? undefined) as number | undefined,
    subcategoryId: txn.subcategoryId ?? undefined,
    type: String(txn.type) as ViewTransactionDefaults["type"],
    remarks: txn.remarks ?? "",
    same_as_recipient: (txn.recipient_name ?? "") === (txn.recipient ?? ""),
    // Pass Date; component renders in Asia/Kolkata and converts back to UTC
    timestamp: txn.timestamp,
  };

  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Transaction</h1>
          <p className="text-muted-foreground leading-snug">View or edit this transaction.</p>
        </div>
      </div>
      <div className="py-2 md:py-4">
        <ViewTransactionForm
          categories={categories}
          defaults={defaults}
          transactionId={txn.id}
        />
      </div>
    </div>
  );
}
