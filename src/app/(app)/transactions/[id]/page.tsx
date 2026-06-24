import { notFound } from "next/navigation";

import { getTransactionDetailPageData } from "@/server/page-data/transaction-detail-page-data";

import { TransactionDetailPageView } from "./_components/transaction-detail-page-view";

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;
  const transactionId = Number(id);

  if (!Number.isInteger(transactionId) || transactionId <= 0) {
    notFound();
  }

  const data = await getTransactionDetailPageData(transactionId);

  return <TransactionDetailPageView {...data} />;
}
