import { DrilldownPlaceholderPage } from "../_drilldown-placeholder";

type RecipientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecipientsPage({ searchParams }: RecipientsPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Recipients"
      description="Recipient review will land here as the workspace expands."
      searchParams={await searchParams}
    />
  );
}