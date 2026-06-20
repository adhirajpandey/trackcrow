import { DashboardPageView } from "./_components/dashboard-page-view";
import { getDashboardPageData } from "@/server/page-data/dashboard-page-data";
import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
import { cookies } from "next/headers";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const data = await getDashboardPageData(searchParams, {
    persistedRange: cookieStore.get(dashboardRangeCookieName)?.value ?? null,
  });

  return <DashboardPageView data={data} />;
}
