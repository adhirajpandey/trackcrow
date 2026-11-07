import { cookies } from "next/headers";

import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
import { getInsightsPageData } from "@/server/page-data/insights-page-data";

import { InsightsPageView } from "./_components/insights-page-view";

type InsightsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InsightsPage(props: InsightsPageProps) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const data = await getInsightsPageData(searchParams, {
    persistedRange: cookieStore.get(dashboardRangeCookieName)?.value ?? null,
  });

  const reviewOnly = searchParams.review === "1";
  return <InsightsPageView key={`${data.range.value}:${data.range.startDate}:${data.range.endDate}:${data.focusDay ?? ""}:${reviewOnly}`} data={data} initialReviewOnly={reviewOnly} />;
}
