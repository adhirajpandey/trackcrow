import { Wallet, ArrowUpRight } from "lucide-react";
import { StructuredDataCard } from "./structured-data-card";

type TopExpenseResult = {
  id?: number;
  category: string;
  amount: number;
  startDate?: string | null;
  endDate?: string | null;
};

type TopExpenseCardProps = {
  message: string;
  result?: TopExpenseResult | null;
};

export const TopExpenseCard = ({ message, result }: TopExpenseCardProps) => {
  if (!result) {
    return (
      <StructuredDataCard
        title="Top Expense"
        icon={<Wallet className="w-6 h-6 text-emerald-400" />}
      >
        <p className="text-gray-400 text-sm italic text-center">{message}</p>
      </StructuredDataCard>
    );
  }

  const { id, category, amount, startDate, endDate } = result;

  const dateRange =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-IN")} — ${new Date(
          endDate
        ).toLocaleDateString("en-IN")}`
      : "All Time";

  return (
    <StructuredDataCard
      title="Top Expense"
      icon={<Wallet className="w-6 h-6 text-emerald-400" />}
      dateRange={dateRange}
      action={
        id ? (
          <a
            href={`/transactions/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowUpRight className="w-5 h-5" />
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm text-gray-400">
            Category: <span className="text-white font-medium">{category}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">Total Spent:</p>
          <p className="text-2xl font-bold text-emerald-400 tracking-tight ml-2">
            ₹{amount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </StructuredDataCard>
  );
};
