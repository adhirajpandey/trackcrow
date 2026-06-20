import { z } from "zod";

const optionalDateParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
}, z.coerce.date().optional());

export const dashboardRangeQuerySchema = z.object({
  startDate: optionalDateParam,
  endDate: optionalDateParam,
});

export const spendingByPeriodQuerySchema = dashboardRangeQuerySchema.extend({
  granularity: z.enum(["day", "week", "month", "year"]).optional(),
});
