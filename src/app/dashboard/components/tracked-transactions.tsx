import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { numberToINR, formatDateTime, toDate } from "@/common/utils";
import type { Transaction } from "@/common/schemas";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TrackedTransactions({ txns, selectedTimeframe }: { txns: Transaction[], selectedTimeframe: string }) {
  if (!txns || !txns.length) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="px-2 pt-4 sm:px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Tracked Transactions
          </CardTitle>
          <Link href={`/transactions?month=${selectedTimeframe}`}>
            <Button variant="link" className="px-0" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="h-80 px-2 pb-4 sm:px-4 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-2 pt-4 sm:px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Tracked Transactions
        </CardTitle>
        <Link href={`/transactions?month=${selectedTimeframe}`}>
          <Button variant="link" className="px-0" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="divide-y divide-border px-2 pb-4 sm:px-4">
        <ul className="divide-y divide-border">
          {(() => {
            const sorted = [...txns].sort(
              (a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime(),
            );
            const displayed = sorted.slice(0, 5);
            const placeholders = Math.max(0, 5 - displayed.length);

            return (
              <>
                {displayed.map((txn) => (
                  <li key={txn.uuid}>
                    <Link href={`/transactions/${txn.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-accent/40 transition-colors">
                    <Avatar className="h-8 w-8 text-xs">
                      <AvatarFallback className="text-xs">
                        {(
                          txn.recipient_name?.[0] || txn.recipient[0]
                        )?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">
                          {txn.recipient_name || txn.recipient}
                        </div>
                        {txn.type ? (
                          <span className="ml-2 inline-block shrink-0 rounded px-2 py-0.5 bg-muted text-muted-foreground text-[10px]">
                            {txn.type}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                        <span className="truncate">
                          {txn.category || "Uncategorized"}
                          {txn.subcategory ? ` • ${txn.subcategory}` : ""}
                        </span>
                        {txn.remarks ? (
                          <span className="truncate"> • {txn.remarks}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {numberToINR(Math.abs(txn.amount))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(txn.timestamp as string | Date)}
                      </div>
                    </div>
                    </Link>
                  </li>
                ))}
                {Array.from({ length: placeholders }).map((_, idx) => (
                  <li
                    key={`placeholder-${idx}`}
                    className="flex items-center gap-3 px-4 py-3 sm:px-6 opacity-0"
                  >
                    <div className="h-8" />
                  </li>
                ))}
              </>
            );
          })()}
        </ul>
      </CardContent>
    </Card>
  );
}
