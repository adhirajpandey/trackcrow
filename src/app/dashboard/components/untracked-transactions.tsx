import type { TransactionRecord } from "@/common/types";
import { TransactionListCard } from "./transaction-list-card";

export function UntrackedTransactions({
  txns,
  selectedTimeframe,
}: {
  txns: TransactionRecord[];
  selectedTimeframe: string;
}) {
  return (
    <TransactionListCard
      title="Untracked Transactions"
      txns={txns}
      viewAllHref={`/transactions?category=Uncategorized&month=${selectedTimeframe}`}
      emptyMessage="No data available"
    />
  );
}
