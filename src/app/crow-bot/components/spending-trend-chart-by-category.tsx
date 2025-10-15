"use client";
import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type SpendingTrendChartByCategoryProps = {
  trendData?: Array<Record<string, number | string>>;
  message?: string;
};

export const SpendingTrendChartByCategory: React.FC<
  SpendingTrendChartByCategoryProps
> = ({ trendData = [], message }) => {
  const categories = useMemo(() => {
    if (trendData.length === 0) return [];

    const keys = new Set<string>();
    trendData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== "date") keys.add(k);
      });
    });
    return Array.from(keys);
  }, [trendData]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trendData.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (key !== "date" && value != null && value !== 0) {
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    return counts;
  }, [trendData]);

  const hasData = trendData.length > 0;
  const palette = ["#40c057", "#ffd43b", "#339af0", "#845ef7", "#f06595"];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-xl border border-[#333] shadow-md bg-black">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3 mb-6">
        Spending Trend By Category
      </h2>

      {!hasData ? (
        <p className="text-gray-500 text-center italic">
          {message || "No trend data available."}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#aaa"
              tick={{ fill: "#aaa", fontSize: 12 }}
              tickLine={false}
              minTickGap={20}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })
              }
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
              labelFormatter={(v) =>
                new Date(v).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })
              }
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: any) =>
                `₹${Number(value).toLocaleString("en-IN")}`
              }
            />
            <Legend wrapperStyle={{ color: "#fff" }} />

            {categories.map((cat, i) => {
              const color = palette[i % palette.length];
              const count = categoryCounts[cat] || 0;

              return (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  strokeWidth={2}
                  strokeOpacity={0.9}
                  stroke={color}
                  dot={
                    count === 1
                      ? { stroke: color, strokeWidth: 2, r: 4 }
                      : false
                  }
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
