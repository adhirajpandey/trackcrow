export type DashboardRangeInput = {
  userUuid: string;
  startDate?: Date;
  endDate?: Date;
};

export type SpendingByPeriodInput = DashboardRangeInput & {
  granularity?: "day" | "week" | "month" | "year";
};
