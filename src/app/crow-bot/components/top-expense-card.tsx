import { Wallet, ArrowUpRight } from "lucide-react";

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
  // 🧩 Handle empty result safely
  if (!result) {
    return (
      <div className="relative w-full max-w-3xl mx-auto rounded-2xl border border-border bg-background/50 p-8 shadow-md text-center transition-all">
        <h2 className="text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 mb-4">
          <Wallet className="w-6 h-6 text-emerald-400" />
          Top Expense
        </h2>
        <p className="text-gray-400 text-sm italic">{message}</p>
      </div>
    );
  }

  // ✅ Extract and safely default values
  const { id, category, amount, startDate, endDate } = result;
  const safeAmount = typeof amount === "number" ? amount : 0;

  const formattedRange =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} — ${new Date(endDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`
      : startDate
        ? `Since ${new Date(startDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`
        : "All Time";

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl border border-border bg-background/50 p-8 shadow-md hover:shadow-lg transition-all duration-200">
      {/* Header with Arrow like DashboardSummaryLink */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2 text-gray-200">
          <Wallet className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-semibold">Top Expense</h2>
        </div>

        {id && (
          <a
            href={`/transactions/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
            title="View transaction details"
          >
            <ArrowUpRight className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Main Info */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-gray-400">Category</p>
          <p className="text-xl font-semibold text-white mt-1">
            {category || "Unknown"}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Total Spent</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">
            ₹{safeAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Date Range */}
      <div className="mt-6 text-right">
        <p className="text-xs text-gray-500 italic">{formattedRange}</p>
      </div>

      {/* Message */}
      <div className="mt-4 text-gray-400 text-sm italic text-center">
        {message}
      </div>
    </div>
  );
};
