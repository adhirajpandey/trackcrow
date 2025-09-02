import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 - 100
  color?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color = "bg-gray-400", ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${pct}%` }}
            aria-valuenow={pct}
            role="progressbar"
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
