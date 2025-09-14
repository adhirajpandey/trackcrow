"use client";

import { useRouter } from "next/navigation";
import { TimeframeSelector } from "@/app/transactions/components/timeframe-selector";

interface DashboardTimeframeSelectorProps {
  initialMonthParam: string;
}

export function DashboardTimeframeSelector({
  initialMonthParam,
}: DashboardTimeframeSelectorProps) {
  const router = useRouter();

  const handleSelectTimeframe = (newMonthParam: string | "all") => {
    const params = new URLSearchParams(window.location.search);
    params.set("month", newMonthParam);
    router.push(`?${params.toString()}`);
  };

  return (
    <TimeframeSelector
      initialMonthParam={initialMonthParam}
      onSelectTimeframe={handleSelectTimeframe}
    />
  );
}
