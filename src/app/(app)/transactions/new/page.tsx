import { getTransactionCreatePageData } from "@/server/page-data/transaction-create-page-data";

import { TransactionCreatePageView } from "./_components/transaction-create-page-view";

export default async function TransactionCreatePage() {
  const data = await getTransactionCreatePageData();
  return <TransactionCreatePageView {...data} />;
}
