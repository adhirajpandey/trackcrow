import { notFound } from "next/navigation";

import { getRecipientDetailPageData } from "@/server/page-data/recipient-detail-page-data";

import { RecipientDetailPageView } from "./_components/recipient-detail-page-view";

type RecipientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipientDetailPage({
  params,
}: RecipientDetailPageProps) {
  const { id } = await params;
  const recipientId = Number(id);

  if (!Number.isInteger(recipientId) || recipientId <= 0) {
    notFound();
  }

  const data = await getRecipientDetailPageData(recipientId);

  return <RecipientDetailPageView {...data} />;
}
