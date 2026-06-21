import Link from "next/link";

function formatSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const entries = Object.entries(searchParams).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => [key, item] as const);
    }

    return value ? [[key, value] as const] : [];
  });

  return entries;
}

export function DrilldownPlaceholderPage({
  title,
  description,
  searchParams,
}: {
  title: string;
  description: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = formatSearchParams(searchParams);

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <h1 className="text-[32px] font-bold leading-tight text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase text-card-foreground">
          Current drilldown
        </h2>
        {filters.length > 0 ? (
          <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filters.map(([key, value]) => (
              <div key={`${key}-${value}`} className="rounded-md border border-border bg-muted p-3">
                <dt className="text-xs text-muted-foreground">{key}</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No filters were passed from the dashboard.
          </p>
        )}
        <Link
          href="/dashboard"
          className="mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to dashboard
        </Link>
      </section>
    </div>
  );
}
