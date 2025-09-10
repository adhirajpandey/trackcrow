import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ViewTransactionForm,
  type ViewTransactionDefaults,
} from "./view-transaction-form";
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal
import { TransactionType } from "../../../generated/prisma"; // Import enums

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="text-center text-red-500 p-4">
        <p>{message}</p>
      </div>
    </div>
  );
}

interface PrismaTransactionResult {
  uuid: string;
  id: number;
  type: TransactionType;
  user_uuid: string;
  timestamp: Date;
  amount: Decimal;
  recipient: string;
  recipient_name: string | null;
  reference: string | null;
  account: string | null;
  remarks: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number | null;
  subcategoryId: number | null;
}

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

  const [categories, txn] = await Promise.all([
    prisma.category.findMany({
      where: { user_uuid: session.user.uuid },
      include: { Subcategory: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findFirst({
      where: { id: idNum, user_uuid: session.user.uuid },
    }) as Promise<PrismaTransactionResult | null>, // Explicitly cast txn
  ]);

  if (!txn) {
    return (
      <ErrorMessage message="Transaction not found" />
    );
  }

  const amount = txn.amount.toNumber();
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
          <p className="text-muted-foreground leading-snug">
            View or edit this transaction.
          </p>
        </div>
      </div>
      <div className="py-2 md:py-4">
        <ViewTransactionForm
          categories={categories}
          defaults={defaults}
          transactionId={txn.id}
          searchParams={resolvedSearchParams}
        />
      </div>
    </div>
  );
}
