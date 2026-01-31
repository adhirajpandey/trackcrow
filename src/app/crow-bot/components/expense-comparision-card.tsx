"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, BarChart3 } from "lucide-react";

type ExpenseComparisonProps = {
  message?: string;
  results?: { label: string; totalSpent: number }[];
};

export const ExpenseComparisonCard = ({
  message = "",
  results = [],
}: ExpenseComparisonProps) => {
  const dashboardUrl = "/dashboard";

  const COLORS = ["#a855f7", "#f472b6", "#22d3ee", "#10b981", "#fbbf24"];
  const total = Array.isArray(results)
    ? results.reduce((acc, r) => acc + (r?.totalSpent || 0), 0)
    : 0;

  if (!Array.isArray(results) || results.length === 0 || total === 0) {
    return (
      <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-border px-4 sm:px-8 py-4 sm:py-6 shadow-md bg-background/40 text-center transition-all">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-100">
            Expense Comparison
          </h2>
        </div>
        <p className="text-gray-400 text-xs sm:text-sm italic">
          No data available for comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-border px-4 sm:px-8 py-4 sm:py-6 shadow-md flex flex-col space-y-4 bg-background/40 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm sm:text-base font-semibold text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Expense Comparison
        </h2>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
          title="Open detailed dashboard"
        >
          <ArrowUpRight className="w-5 h-5" />
        </a>
      </div>

      {/* Message */}
      {message && (
        <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
          {message}
        </p>
      )}

      {/* Pie Chart */}
      <div className="pt-2 w-full">
        <ResponsiveContainer
          width="100%"
          height={260}
          className="sm:!h-[320px]"
        >
          <PieChart>
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                `₹${(value ?? 0).toLocaleString("en-IN")}`,
                name ?? "Unknown",
              ]}
              contentStyle={{
                backgroundColor: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{
                color: "#fff",
              }}
              labelStyle={{
                color: "#fff",
              }}
            />

            <Legend wrapperStyle={{ fontSize: "12px" }} />

            <Pie
              data={results}
              dataKey="totalSpent"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={window.innerWidth < 640 ? 90 : 120}
              labelLine={false}
              label={({ name, percent }) =>
                window.innerWidth < 640
                  ? ""
                  : `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`
              }
            >
              {results.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#0f0f0f"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <p className="text-[10px] sm:text-xs text-gray-500 text-right italic">
        Chart type: <span className="text-gray-300 font-medium">PIE</span>
      </p>
    </div>
  );
};
