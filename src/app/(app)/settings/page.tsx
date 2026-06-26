import { DrilldownPlaceholderPage } from "../_drilldown-placeholder";

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Settings"
      description="Account, device token, and import configuration controls will land here."
      searchParams={await searchParams}
    />
  );
}