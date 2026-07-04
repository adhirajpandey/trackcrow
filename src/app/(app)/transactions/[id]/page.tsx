import { notFound } from "next/navigation";
import { z } from "zod";

import { getTransactionDetailPageData } from "@/server/page-data/transaction-detail-page-data";

import { TransactionDetailPageView } from "./_components/transaction-detail-page-view";

const transactionUuidSchema = z.string().uuid();

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;
  const parsed = transactionUuidSchema.safeParse(id);

  if (!parsed.success) {
    notFound();
  }

  const data = await getTransactionDetailPageData(parsed.data);

  return <TransactionDetailPageView {...data} />;
}
