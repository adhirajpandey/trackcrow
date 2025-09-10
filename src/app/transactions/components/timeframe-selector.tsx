"use client";

import { useMemo } from "react";
import { toMonthKey, monthLabelFromKey } from "@/common/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimeframeSelectorProps {
  initialMonthParam: string;
  onSelectTimeframe: (month: string | "all") => void;
}

export function TimeframeSelector({
  initialMonthParam,
  onSelectTimeframe,
}: TimeframeSelectorProps) {

  const monthKeysDescending = useMemo(() => {
    const keys: string[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      // Generate last 12 months
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      keys.push(toMonthKey(d));
    }
    return keys;
  }, []);

  const handleSelect = (newMonthParam: string | "all") => {
    onSelectTimeframe(newMonthParam);
  };

  const selectedLabel =
    initialMonthParam === "all" ? "All time" : monthLabelFromKey(initialMonthParam);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 font-bold w-[140px] md:w-auto justify-center"
        >
          {selectedLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mx-2 max-w-xs">
        <DropdownMenuLabel>Timeframe</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSelect("all")}>
          All time
        </DropdownMenuItem>
        {monthKeysDescending.map((key) => (
          <DropdownMenuItem key={key} onClick={() => handleSelect(key)}>
            {monthLabelFromKey(key)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
