import { getTransactionsPageData } from "@/server/page-data/transactions-page-data";
import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
import { cookies } from "next/headers";

import { TransactionsPageView } from "./_components/transactions-page-view";

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const cookieStore = await cookies();
  const data = await getTransactionsPageData(await searchParams, {
    persistedRange: cookieStore.get(dashboardRangeCookieName)?.value ?? null,
  });

  return <TransactionsPageView {...data} />;
}
