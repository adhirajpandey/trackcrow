"use client";

import * as React from "react";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateOption = "today" | "last-week" | "last-month" | "custom";

interface DateRangePickerMenuProps {
  onDateRangeChange: (dateRange: DateRange) => void; // Callback to send date range to parent
}

export function DateRangePickerMenu({
  onDateRangeChange,
}: DateRangePickerMenuProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [selectedOption, setSelectedOption] = React.useState<
    DateOption | undefined
  >(undefined);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectChange = (value: string) => {
    const option = value as DateOption;
    setSelectedOption(option);

    if (option === "custom") {
      setIsOpen(true);
    } else {
      let from: Date, to: Date;
      const now = new Date();
      switch (option) {
        case "today":
          from = startOfDay(now);
          to = endOfDay(now);
          break;
        case "last-week":
          from = startOfDay(subDays(now, 7));
          to = endOfDay(now);
          break;
        case "last-month":
          from = startOfDay(subMonths(now, 1));
          to = endOfDay(now);
          break;
        default:
          from = now;
          to = now;
      }
      const newRange = { from, to };
      setDateRange(newRange);
      onDateRangeChange(newRange); // Notify parent component
    }
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
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Filter by date range">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="last-week">Last Week</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[675px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(newDateRange) => {
                  setDateRange(newDateRange);
                  if (newDateRange?.from && newDateRange?.to) {
                    setSelectedOption("custom");
                    setIsOpen(false);
                    onDateRangeChange(newDateRange); // Notify parent component
                  }
                }}
                numberOfMonths={2}
                initialFocus
                className="flex-1"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
