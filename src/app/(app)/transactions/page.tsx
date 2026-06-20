import { DrilldownPlaceholderPage } from "../_drilldown-placeholder";

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Transactions"
      description="Filtered transaction review will land here. The current pass wires dashboard drilldowns without building the full table yet."
      searchParams={await searchParams}
    />
  );
}