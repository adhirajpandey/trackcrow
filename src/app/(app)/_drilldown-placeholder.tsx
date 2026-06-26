import Link from "next/link";

import { AppPageHeader } from "@/components/product/app-page-header";

function formatSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  return Object.entries(searchParams).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => [key, item] as const);
    }

    return value ? [[key, value] as const] : [];
  });
}

function getFilterLabel(key: string, value: string) {
  if (key === "status" && value === "uncategorized") {
    return {
      label: "Status",
      value: "Uncategorized transactions",
    };
  }

  if (key === "review" && value === "queue") {
    return {
      label: "Review set",
      value: "All dashboard review items",
    };
  }

  if (key === "review" && value === "large") {
    return {
      label: "Review set",
      value: "Large transactions",
    };
  }

  if (key === "sortBy" && value === "amount") {
    return {
      label: "Sort by",
      value: "Amount",
    };
  }

  if (key === "sortOrder" && value === "desc") {
    return {
      label: "Order",
      value: "Highest first",
    };
  }

  if (key === "startDate") {
    return {
      label: "Start date",
      value,
    };
  }

  if (key === "endDate") {
    return {
      label: "End date",
      value,
    };
  }

  if (key === "category") {
    return {
      label: "Category",
      value,
    };
  }

  if (key === "transaction") {
    return {
      label: "Transaction",
      value: `Selected transaction ${value}`,
    };
  }

  return {
    label: key,
    value,
  };
}

export function DrilldownPlaceholderPage({
  title,
  description,
  searchParams,
  emptyTitle = "No filters were passed from the dashboard.",
  contextNote,
}: {
  title: string;
  description: string;
  searchParams: Record<string, string | string[] | undefined>;
  emptyTitle?: string;
  contextNote?: string;
}) {
  const filters = formatSearchParams(searchParams).map(([key, value]) =>
    getFilterLabel(key, value)
  );

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Dashboard drilldown"
        title={title}
        description={description}
      />

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-card-foreground">
              Applied filters
            </h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              This placeholder preserves the dashboard context so the final review flow can land in
              the right filtered state.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to dashboard
          </Link>
        </div>

        {filters.length > 0 ? (
          <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filters.map((filter) => (
              <div key={`${filter.label}-${filter.value}`} className="rounded-xl bg-muted/26 p-3">
                <dt className="text-sm font-semibold text-foreground">{filter.label}</dt>
                <dd className="mt-1 text-sm leading-5 text-muted-foreground">{filter.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 rounded-xl bg-muted/26 px-4 py-3 text-sm text-muted-foreground">
            {emptyTitle}
          </p>
        )}

        {contextNote ? (
          <div className="mt-5 rounded-xl border border-border/70 bg-muted/18 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">What this view will cover</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{contextNote}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
