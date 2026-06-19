import { DashboardPageView } from "./_components/dashboard-page-view";
import { getDashboardPageData } from "@/server/page-data/dashboard-page-data";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const data = await getDashboardPageData(searchParams);

  return <DashboardPageView data={data} />;
}
