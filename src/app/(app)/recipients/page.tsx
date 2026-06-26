import { getRecipientsPageData } from "@/server/page-data/recipients-page-data";

import { RecipientsPageView } from "./_components/recipients-page-view";

type RecipientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecipientsPage({ searchParams }: RecipientsPageProps) {
  const data = await getRecipientsPageData(await searchParams);

  return <RecipientsPageView {...data} />;
}
