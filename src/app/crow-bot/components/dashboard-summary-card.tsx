import { ArrowUpRight, BarChart3 } from "lucide-react";

export const DashboardSummaryLink = () => {
  const dashboardUrl = "/dashboard";

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto rounded-lg border border-border p-3 sm:px-5 sm:py-3 shadow-sm bg-background/40 hover:bg-background/60 transition-colors">
      <div className="flex items-center gap-2 text-gray-200 min-w-0">
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base truncate">
          Dashboard Summary
        </span>
      </div>
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors ml-3 flex-shrink-0"
        title="Open full dashboard in new tab"
      >
        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </a>
    </div>
  );
};
