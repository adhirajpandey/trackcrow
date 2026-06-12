import type { TransactionRecord } from "@/common/types";
import { TransactionListCard } from "./transaction-list-card";

export function TrackedTransactions({
  txns,
  selectedTimeframe,
}: { 
  txns: TransactionRecord[];
  selectedTimeframe: string;
}) {
  return (
    <TransactionListCard
      title="Tracked Transactions"
      txns={txns}
      viewAllHref={`/transactions?month=${selectedTimeframe}`}
      emptyMessage="No data available"
    />
  );
}
