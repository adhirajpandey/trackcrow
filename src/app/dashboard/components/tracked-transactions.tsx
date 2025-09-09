import type { Transaction } from "@/common/schemas";
import { TransactionListCard } from "./transaction-list-card";

export function TrackedTransactions({
  txns,
  selectedTimeframe,
}: { 
  txns: Transaction[];
  selectedTimeframe: string;
}) {
  return (
    <TransactionListCard
      title="Tracked Transactions"
      txns={txns}
      selectedTimeframe={selectedTimeframe}
      viewAllHref={`/transactions?month=${selectedTimeframe}`}
      emptyMessage="No data available"
    />
  );
}