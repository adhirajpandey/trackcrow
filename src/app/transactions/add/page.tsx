import { AddTransactionForm } from "./add-transaction-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ErrorMessage } from "@/components/error-message";

export default async function AddTransactionPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to add a transaction" />
    );
  }

  const categories = await prisma.category.findMany({
    where: { user_uuid: session.user.uuid },
    include: { Subcategory: true },
    orderBy: { name: "asc" },
  });

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
        <AddTransactionForm categories={categories} />
      </div>
    </div>
  );
}
