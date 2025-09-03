import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { numberToINR, formatISTDateTime } from "@/common/utils";
import type { Transaction } from "@/common/schemas";

export function RecentTransactions({ txns }: { txns: Transaction[] }) {
  if (!txns || !txns.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No recent transactions</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="px-2 pt-4 sm:px-4">
        <CardTitle className="text-base font-semibold">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border px-2 pb-4 sm:px-4">
        <ul className="divide-y divide-border">
          {(() => {
            // normalize timestamp to milliseconds for consistent sorting
            const getTimeMs = (t: Transaction) => {
              if (typeof t.timestamp === "number") {
                // if timestamp seems like seconds (<= 1e12), convert to ms
                return t.timestamp > 1e12 ? t.timestamp : t.timestamp * 1000;
              }
              if (t.ist_datetime) return Date.parse(t.ist_datetime);
              return Date.parse(t.createdAt);
            };

            const sorted = [...txns].sort(
              (a, b) => getTimeMs(b) - getTimeMs(a),
            );
            const displayed = sorted.slice(0, 5);
            const placeholders = Math.max(0, 5 - displayed.length);

            return (
              <>
                {displayed.map((txn) => (
                  <li
                    key={txn.uuid}
                    className="flex items-center gap-3 px-4 py-3 sm:px-6 hover:bg-accent/40 transition-colors"
                  >
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
                        {formatISTDateTime(getTimeMs(txn))}
                      </div>
                    </div>
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
