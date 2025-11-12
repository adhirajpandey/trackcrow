import { Wallet2, Calendar, ArrowUpRight } from "lucide-react";

type TotalSpendCardProps = {
  message: string;
  result?: {
    totalSpent: number;
    category?: string | null;
    remarks?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
};

export const TotalSpendCard = ({ message, result }: TotalSpendCardProps) => {
  if (!result) {
    return (
      <div className="relative w-full max-w-5xl mx-auto rounded-2xl border border-border bg-background/50 p-8 shadow-md text-center transition-all">
        <h2 className="text-lg font-semibold text-gray-200 flex items-center justify-center gap-2 mb-4">
          <Wallet2 className="w-6 h-6 text-blue-400" />
          Total Spend
        </h2>
        <p className="text-gray-400 text-sm italic">{message}</p>
      </div>
    );
  }

  const { totalSpent, category, remarks, startDate, endDate } = result;

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
      : "All Time";

  const getColor = (amount: number) => {
    if (amount === 0) return "text-gray-500";
    if (amount < 5000) return "text-emerald-400";
    if (amount < 20000) return "text-amber-400";
    return "text-red-400";
  };

  const spendColor = getColor(totalSpent);

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-2xl border border-border bg-background/60 p-8 shadow-lg hover:shadow-xl transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          <Wallet2 className="w-6 h-6 text-blue-400" />
          Total Spend
        </h2>
      </div>

      {/* Main Info - Now in a row */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          {category && (
            <p className="text-sm text-gray-400">
              Category:{" "}
              <span className="text-white font-medium">{category}</span>
            </p>
          )}
          {remarks && (
            <p className="text-sm text-gray-400 mt-1">
              Filter:{" "}
              <span className="text-white font-medium">"{remarks}"</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">Total Spent:</p>
          <p className="text-3xl font-bold text-blue-400 tracking-tight ml-2">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Date Range */}
      <div className="mt-6 flex items-center justify-end gap-1 text-xs text-gray-500 italic">
        <Calendar className="w-4 h-4" />
        {formattedRange}
      </div>
    </div>
  );
};
