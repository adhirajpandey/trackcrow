type MonthSummaryProps = {
  month?: string;
  totalSpent?: number;
  topCategories?: string[];
};

export const MonthSummaryCard = ({
  month,
  totalSpent,
  topCategories = [],
}: MonthSummaryProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3">
        Last Month Summary
      </h2>

      <div className="space-y-3 text-sm">
        {month && (
          <div>
            <p className="text-gray-400">Month</p>
            <p className="text-lg font-semibold text-white">{month}</p>
          </div>
        )}

        {typeof totalSpent === "number" && (
          <div>
            <p className="text-gray-400">Total Spent</p>
            <p className="text-lg font-semibold text-white">₹{totalSpent}</p>
          </div>
        )}

        <div>
          <p className="text-gray-400">Top Categories</p>
          {topCategories.length > 0 ? (
            <ul className="list-disc list-inside text-white">
              {topCategories.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No categories available</p>
          )}
        </div>
      </div>
    </div>
  );
};
