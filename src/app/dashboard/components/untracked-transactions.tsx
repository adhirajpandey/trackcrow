import type { Transaction } from "@/common/schemas";
import { TransactionListCard } from "./transaction-list-card";

export function UntrackedTransactions({
  txns,
  selectedTimeframe,
}: {
  txns: Transaction[];
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