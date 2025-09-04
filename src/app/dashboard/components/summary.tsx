import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { numberToINR } from "@/common/utils";
import type { Transaction } from "@/common/schemas";

export function Summary({ transactions }: { transactions: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-2 pt-4 sm:px-4">
          <CardTitle className="text-base font-semibold">Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-80 px-2 pb-4 sm:px-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
  const topCat = transactions.reduce(
    (acc, t) => {
      if (t.category && t.category.trim() !== "") {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const topCatKeys = Object.keys(topCat);
  const topCatName = topCatKeys.length
    ? topCatKeys.reduce((a, b) => (topCat[a] > topCat[b] ? a : b))
    : "Uncategorized";

  const trackedCount = transactions.filter(
    (t) => t.category && t.category.trim() !== "",
  ).length;
  const untrackedCount = transactions.length - trackedCount;
  const trackedPct = Math.round((trackedCount / transactions.length) * 100);
  const untrackedPct = 100 - trackedPct;

  const trackedAmount = transactions.reduce((sum, t) => {
    const hasCategory = t.category && t.category.trim() !== "";
    return hasCategory ? sum + Math.abs(t.amount) : sum;
  }, 0);

  const untrackedAmount = transactions.reduce((sum, t) => {
    const hasCategory = t.category && t.category.trim() !== "";
    return !hasCategory ? sum + Math.abs(t.amount) : sum;
  }, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-2 pt-4 sm:px-4">
        <CardTitle className="text-base font-semibold">Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-2 pb-4 sm:px-4">
        <div className="flex flex-row items-center justify-between gap-4 px-4 pt-3 pb-3 sm:px-6 border-b border-border">
          <div>
            <div className="text-sm text-muted-foreground">Total expense</div>
            <div className="text-3xl md:text-4xl font-extrabold mt-1 tracking-tight">
              {numberToINR(totalExpense)}
            </div>
          </div>

          <div className="min-w-0 text-left md:text-right">
            <div className="text-sm text-muted-foreground">Top category</div>
            <div className="text-lg md:text-xl font-bold mt-1 truncate">
              {topCatName}
            </div>
          </div>
        </div>

        <div className="mt-5 px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card/40 backdrop-blur-sm p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Tracked
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {numberToINR(trackedAmount)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {trackedCount} txns
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={trackedPct}
                  className="h-2"
                  color="bg-emerald-500"
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Transactions with a category
              </div>
            </div>

            <div className="rounded-xl border bg-card/40 backdrop-blur-sm p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Untracked
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {numberToINR(untrackedAmount)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {untrackedCount} txns
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={untrackedPct}
                  className="h-2"
                  color="bg-red-500"
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                No category assigned
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

