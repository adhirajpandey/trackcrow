"use client";

import * as React from "react";
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
  startOfYear as startOfAllTime,
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

interface DateRangePickerMenuProps {
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
}

export function DateRangePickerMenu({
  onDateRangeChange,
}: DateRangePickerMenuProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [tempDateRange, setTempDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [selectedOption, setSelectedOption] = React.useState<
    DateOption | undefined
  >(undefined);
  const [isOpen, setIsOpen] = React.useState(false);

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
          from = startOfAllTime(new Date(2000, 0, 1)); // Assuming data starts from year 2000
          to = endOfDay(now);
          break;
        default:
          from = now;
          to = now;
      }
      const newRange = { from, to };
      setDateRange(newRange);
      onDateRangeChange(newRange);
    }
  };

  const handleApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      setDateRange(tempDateRange);
      onDateRangeChange(tempDateRange);
      setSelectedOption("custom");
    } else {
      setDateRange(undefined);
      onDateRangeChange(undefined);
      setSelectedOption(undefined);
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTempDateRange(dateRange);
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
      <Select onValueChange={handleSelectChange}>
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
          {selectedOption && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {formatDateRange()}
            </div>
          )}
          <SelectItem value="all-time">All time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="past-month">Past Month</SelectItem>
          <SelectItem value="this-year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
                initialFocus
                className="mx-auto"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setTempDateRange(undefined);
              }}
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
