import { DrilldownPlaceholderPage } from "../../_drilldown-placeholder";

type ImportReviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ImportReviewPage({ searchParams }: ImportReviewPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Import review"
      description="Failed and unparseable SMS imports will be reviewed here."
      searchParams={await searchParams}
    />
  );
}