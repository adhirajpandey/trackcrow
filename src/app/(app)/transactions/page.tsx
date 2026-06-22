import { getTransactionsPageData } from "@/server/page-data/transactions-page-data";

import { TransactionsPageView } from "./_components/transactions-page-view";

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const data = await getTransactionsPageData(await searchParams);

  return <TransactionsPageView data={data} />;
}
