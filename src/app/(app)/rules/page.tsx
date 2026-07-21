import { getRulesPageData } from "@/server/page-data/rules-page-data";
import { RulesPageView } from "./_components/rules-page-view";

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <RulesPageView {...(await getRulesPageData(params))} />;
}
