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
      emptyTitle="Open the import issues task from the dashboard to arrive here with the selected date range."
      contextNote="Import issues currently means SMS messages that failed parsing or were marked unparseable. The final review flow will separate those cases while preserving the dashboard date range."
    />
  );
}
