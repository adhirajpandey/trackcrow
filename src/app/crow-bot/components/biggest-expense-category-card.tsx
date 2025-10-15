"use client";
import React, { useMemo } from "react";

type BiggestExpenseCategoryResult = {
  message?: string;
  biggestCategory?: string;
  biggestAmount?: number;
  percent?: number;
  total?: number;
};

type BiggestExpenseCategoryProps = {
  result?: BiggestExpenseCategoryResult;
  title?: string;
};

// Simple INR formatter
function formatINR(amount: number | null | undefined) {
  if (!amount || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export const BiggestExpenseCategory: React.FC<BiggestExpenseCategoryProps> = ({
  result,
  title = "Biggest Expense Category",
}) => {
  // Compute fallback-safe display values
  const { biggestCategory, biggestAmount, percent, total } = useMemo(() => {
    if (!result) {
      return {
        biggestCategory: "—",
        biggestAmount: 0,
        percent: 0,
        total: 0,
      };
    }
    return {
      biggestCategory: result.biggestCategory ?? "—",
      biggestAmount: result.biggestAmount ?? 0,
      percent: result.percent ?? 0,
      total: result.total ?? 0,
    };
  }, [result]);

  const colorMap: Record<string, string> = {
    Food: "#ff4d4d",
    Rent: "#ffd43b",
    Travel: "#40c057",
    Entertainment: "#845ef7",
    Other: "#339af0",
  };

  const color = colorMap[biggestCategory] || "#999";
  const hasData = total > 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-black border border-[#333] rounded-xl shadow-md">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3 mb-6">
        {title}
      </h2>

      {!hasData ? (
        <p className="text-gray-500 text-center italic">
          {result?.message || "No expense data available."}
        </p>
      ) : (
        <div className="flex flex-col items-center space-y-3 text-center">
          <div
            className="text-2xl font-bold text-white px-4 py-2 rounded-lg"
            style={{ backgroundColor: color, opacity: 0.9 }}
          >
            {biggestCategory}
          </div>

          <div className="text-gray-400 text-sm">Total Spent</div>
          <div className="text-3xl font-semibold text-white">
            {formatINR(biggestAmount)}
          </div>

          <div className="text-sm text-gray-500">
            {percent}% of total spending
          </div>

          <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden mt-3">
            <div
              className="h-2 rounded-full"
              style={{ backgroundColor: color, width: `${percent}%` }}
            />
          </div>

          {result?.message && (
            <p className="text-xs text-gray-400 mt-2">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BiggestExpenseCategory;
