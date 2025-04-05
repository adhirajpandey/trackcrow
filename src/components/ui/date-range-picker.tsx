"use client";

import * as React from "react";
import { useDateRange } from "@/context/date-range-context";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateOption =
  | "today"
  | "this-week"
  | "this-month"
  | "past-month"
  | "this-year"
  | "all-time"
  | "custom";

type DateRangePickerMenuProps = {
  onChange: (dateRange: DateRange | undefined) => void;
};

export function DateRangePickerMenu({ onChange }: DateRangePickerMenuProps) {
  const { dateRange, setDateRange } = useDateRange();

  const [tempDateRange, setTempDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [selectedOption, setSelectedOption] = React.useState<
    DateOption | undefined
  >(undefined);
  const [isOpen, setIsOpen] = React.useState(false);
  const [numMonths, setNumMonths] = React.useState(1);

  // Safe usage of window
  React.useEffect(() => {
    const updateMonths = () => {
      if (typeof window !== "undefined") {
        setNumMonths(window.innerWidth >= 768 ? 2 : 1);
      }
    };
    updateMonths();
    window.addEventListener("resize", updateMonths);
    return () => window.removeEventListener("resize", updateMonths);
  }, []);

  React.useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) {
      setSelectedOption(undefined);
      return;
    }

    const now = new Date();
    if (
      dateRange.from.getTime() === startOfDay(now).getTime() &&
      dateRange.to.getTime() === endOfDay(now).getTime()
    ) {
      setSelectedOption("today");
    } else if (
      dateRange.from.getTime() === startOfWeek(now).getTime() &&
      dateRange.to.getTime() === endOfWeek(now).getTime()
    ) {
      setSelectedOption("this-week");
    } else if (
      dateRange.from.getTime() === startOfMonth(now).getTime() &&
      dateRange.to.getTime() === endOfMonth(now).getTime()
    ) {
      setSelectedOption("this-month");
    } else if (
      dateRange.from.getTime() === startOfMonth(subMonths(now, 1)).getTime() &&
      dateRange.to.getTime() === endOfMonth(subMonths(now, 1)).getTime()
    ) {
      setSelectedOption("past-month");
    } else if (
      dateRange.from.getTime() === startOfYear(now).getTime() &&
      dateRange.to.getTime() === endOfYear(now).getTime()
    ) {
      setSelectedOption("this-year");
    } else if (
      dateRange.from.getTime() === new Date(2000, 0, 1).getTime() &&
      dateRange.to.getTime() === endOfDay(now).getTime()
    ) {
      setSelectedOption("all-time");
    } else {
      setSelectedOption("custom");
    }
  }, [dateRange]);

  const handleSelectChange = (value: string) => {
    const option = value as DateOption;
    setSelectedOption(option);

    if (option === "custom") {
      setIsOpen(true);
      setTempDateRange(dateRange);
    } else {
      let from: Date, to: Date;
      const now = new Date();
      switch (option) {
        case "today":
          from = startOfDay(now);
          to = endOfDay(now);
          break;
        case "this-week":
          from = startOfWeek(now);
          to = endOfWeek(now);
          break;
        case "this-month":
          from = startOfMonth(now);
          to = endOfMonth(now);
          break;
        case "past-month":
          from = startOfMonth(subMonths(now, 1));
          to = endOfMonth(subMonths(now, 1));
          break;
        case "this-year":
          from = startOfYear(now);
          to = endOfYear(now);
          break;
        case "all-time":
          from = new Date(2000, 0, 1);
          to = endOfDay(now);
          break;
        default:
          from = now;
          to = now;
      }
      const newRange = { from, to };
      setDateRange(newRange);
      onChange(newRange);
    }
  };

  const handleApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      setDateRange(tempDateRange);
      setSelectedOption("custom");
      onChange(tempDateRange);
    } else {
      setDateRange(undefined);
      setSelectedOption(undefined);
      onChange(undefined);
    }
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (selectedOption && selectedOption !== "custom") {
      return selectedOption
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`;
    }
    return "Select date range";
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <Select onValueChange={handleSelectChange} value={selectedOption}>
        <SelectTrigger className="w-full md:w-[300px]">
          <SelectValue
            placeholder={
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline ml-2">
                  Filter by date range
                </span>
              </div>
            }
          >
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden md:inline ml-2">{formatDateRange()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-time">All time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="past-month">Past Month</SelectItem>
          <SelectItem value="this-year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
        <DialogContent className="w-[90vw] md:w-[600px] p-3">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={tempDateRange}
                onSelect={setTempDateRange}
                numberOfMonths={numMonths}
                initialFocus
                className="mx-auto"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTempDateRange(undefined)}
            >
              Clear
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
