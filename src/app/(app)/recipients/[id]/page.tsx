import { notFound } from "next/navigation";
import { z } from "zod";

import { getRecipientDetailPageData } from "@/server/page-data/recipient-detail-page-data";

import { RecipientDetailPageView } from "./_components/recipient-detail-page-view";

const recipientUuidSchema = z.string().uuid();

type RecipientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipientDetailPage({
  params,
}: RecipientDetailPageProps) {
  const { id } = await params;
  const parsed = recipientUuidSchema.safeParse(id);

  if (!parsed.success) {
    notFound();
  }

  const data = await getRecipientDetailPageData(parsed.data);

  return <RecipientDetailPageView {...data} />;
}
