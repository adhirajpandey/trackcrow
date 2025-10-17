"use client";
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type MonthlyComparisonChartProps = {
  output?: any;
};

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  output,
}) => {
  const parsed = useMemo(() => {
    try {
      if (!output) return {};
      if (typeof output === "string") return JSON.parse(output);
      if (output.output) return output.output;
      return output;
    } catch {
      return {};
    }
  }, [output]);

  const trendData = useMemo(() => parsed.trendData || [], [parsed]);
  const message = useMemo(() => parsed.message || "", [parsed]);
  const currentMonthTotal = useMemo(() => parsed.currentMonth || 0, [parsed]);
  const lastMonthTotal = useMemo(() => parsed.lastMonth || 0, [parsed]);
  const percentChange = useMemo(() => parsed.percentChange || 0, [parsed]);
  const trend = useMemo(() => parsed.trend || "neutral", [parsed]);

  const groupedData = useMemo(() => {
    if (!Array.isArray(trendData) || trendData.length === 0) return [];

    const byMonth: Record<string, number> = {};

    trendData.forEach((item) => {
      if (!item.date) return;
      // Split the date manually (avoid timezone edge cases)
      const [year, month, day] = item.date.split("-").map(Number);
      const d = new Date(year, month - 1, day); // local safe date
      if (isNaN(d.getTime())) return;

      const monthKey = d.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      byMonth[monthKey] = (byMonth[monthKey] || 0) + (item.total || 0);
    });

    console.log("📆 Grouped by month:", byMonth);

    return Object.entries(byMonth).map(([month, total]) => ({
      month,
      total,
    }));
  }, [trendData]);

  // Prepare data for BarChart
  const barData = useMemo(() => {
    if (groupedData.length < 2) return groupedData;
    const [last, current] = groupedData;
    return [
      { label: "Last Month", value: last.total },
      { label: "This Month", value: current.total },
    ];
  }, [groupedData]);

  console.log("📊 trendData:", trendData);
  console.log("📊 groupedData:", groupedData);
  console.log("📊 barData:", barData);

  const trendColor =
    trend === "up" ? "#ef4444" : trend === "down" ? "#22c55e" : "#888";
  const trendIcon = trend === "up" ? "▲" : trend === "down" ? "▼" : "■";

  const hasData = barData.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black border border-[#333] rounded-xl shadow-md">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3 mb-6">
        Last Month vs This Month
      </h2>

      {!hasData ? (
        <p className="text-gray-500 text-center italic">
          {message || "No spending data available for comparison."}
        </p>
      ) : (
        <>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={barData} barGap={60}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke="#aaa"
                  tick={{ fill: "#aaa", fontSize: 12 }}
                />
                <YAxis
                  stroke="#aaa"
                  tick={{ fill: "#aaa" }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    borderColor: "#444",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(v: any) => `₹${v.toLocaleString("en-IN")}`}
                />
                <Legend wrapperStyle={{ color: "#fff" }} />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[8, 8, 0, 0]}
                  name="Total Spend"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 flex justify-between items-center text-center">
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Last Month</p>
              <p className="text-xl font-semibold text-white">
                ₹{lastMonthTotal.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-px h-10 bg-[#333]" />
            <div className="flex-1">
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-xl font-semibold text-white">
                ₹{currentMonthTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">Change</p>
            <p className="text-2xl font-semibold" style={{ color: trendColor }}>
              {trendIcon} {Math.abs(percentChange).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {trend === "up"
                ? "Spending increased"
                : trend === "down"
                  ? "Spending decreased"
                  : "No change"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
