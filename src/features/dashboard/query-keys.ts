export const dashboardQueryKeys = {
  all: ["dashboard", "all"] as const,
  summary: (filters: { startDate: string | null; endDate: string | null }) =>
    ["dashboard", "summary", { filters }] as const,
  categorySpending: (filters: { startDate: string | null; endDate: string | null }) =>
    ["dashboard", "category-spending", { filters }] as const,
  periodSpending: (filters: {
    startDate: string | null;
    endDate: string | null;
    granularity: "day" | "month";
  }) => ["dashboard", "period-spending", { filters }] as const,
};
