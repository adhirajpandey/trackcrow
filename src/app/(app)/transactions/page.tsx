import { DrilldownPlaceholderPage } from "../_drilldown-placeholder";

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Transactions"
      description="Filtered transaction review will land here. This pass keeps the dashboard drilldown context intact while the full transaction workspace is still being built."
      searchParams={await searchParams}
      emptyTitle="Open a dashboard card, chart bucket, or review task to arrive here with filters applied."
      contextNote="This stub is ready for dashboard handoff paths such as uncategorized items, large transactions, selected chart buckets, and direct transaction focus."
    />
  );
}
