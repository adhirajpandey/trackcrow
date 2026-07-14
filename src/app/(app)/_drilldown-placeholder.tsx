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

      <section className="rounded-[10px] border-2 border-border bg-card p-5 shadow-[4px_5px_0_var(--foreground)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-hand text-[17px] font-normal leading-tight text-destructive">
              Applied filters
            </h2>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              This placeholder preserves the dashboard context so the final review flow can land in
              the right filtered state.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-[8px] border-2 border-border bg-primary px-4 text-sm font-semibold text-foreground shadow-[2px_3px_0_var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to dashboard
          </Link>
        </div>

        {filters.length > 0 ? (
          <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filters.map((filter) => (
              <div key={`${filter.label}-${filter.value}`} className="rounded-[8px] border-2 border-border bg-[var(--paper-mint)] p-3">
                <dt className="text-sm font-semibold text-foreground">{filter.label}</dt>
                <dd className="mt-1 text-sm leading-5 text-muted-foreground">{filter.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 rounded-[8px] border-2 border-border bg-[var(--paper-lilac)] px-4 py-3 text-sm text-muted-foreground">
            {emptyTitle}
          </p>
        )}

        {contextNote ? (
          <div className="mt-5 rounded-[8px] border-2 border-border bg-[var(--paper-yellow)] px-4 py-3">
            <p className="text-sm font-semibold text-foreground">What this view will cover</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{contextNote}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
