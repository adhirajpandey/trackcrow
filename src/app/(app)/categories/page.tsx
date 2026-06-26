import { DrilldownPlaceholderPage } from "../_drilldown-placeholder";

type CategoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  return (
    <DrilldownPlaceholderPage
      title="Categories"
      description="Category management will land here. Dashboard links can already carry category context into this route."
      searchParams={await searchParams}
    />
  );
}