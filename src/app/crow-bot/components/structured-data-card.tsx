import { ReactNode } from "react";

type StructuredDataProps = {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  dateRange?: string | null;
  className?: string;
};

export const StructuredDataCard = ({
  title,
  icon,
  action,
  children,
  dateRange,
  className = "",
}: StructuredDataProps) => {
  return (
    <div
      className={`relative w-full max-w-5xl mx-auto rounded-2xl border border-border bg-background/50 p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3 sm:pb-4">
        <div className="flex items-center gap-2 text-gray-200">
          {icon}
          <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        </div>

        {action}
      </div>

      <div className="mt-6">{children}</div>

      {dateRange && (
        <div className="mt-3 text-left sm:text-right">
          <p className="text-[10px] sm:text-xs text-gray-500 italic">
            {dateRange}
          </p>
        </div>
      )}
    </div>
  );
};
