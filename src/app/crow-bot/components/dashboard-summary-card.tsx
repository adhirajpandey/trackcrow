import { ArrowUpRight, BarChart3 } from "lucide-react";

export const DashboardSummaryLink = () => {
  const dashboardUrl = "/dashboard";

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto rounded-lg border border-border px-5 py-3 shadow-sm bg-background/40 hover:bg-background/60 transition-colors">
      <div className="flex items-center gap-2 text-gray-200">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        <span className="font-medium">Dashboard Summary </span>
      </div>
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-white transition-colors"
        title="Open full dashboard in new tab"
      >
        <ArrowUpRight className="w-5 h-5" />
      </a>
    </div>
  );
};
