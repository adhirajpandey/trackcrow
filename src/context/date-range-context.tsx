"use client";

import React, { createContext, useContext, useState } from "react";
import { DateRange } from "react-day-picker";
import { endOfDay } from "date-fns";

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(
  undefined
);

export const DateRangeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const now = new Date();
  const defaultDateRange: DateRange = {
    from: new Date(2000, 0, 1),
    to: endOfDay(now),
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange
  );

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
};
