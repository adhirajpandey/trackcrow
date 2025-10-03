type TrendPoint = {
  date: string;
  total: number;
};

type SpendTrendProps = {
  period: string;
  trend: TrendPoint[];
};

export const SpendingTrendCard = ({ period, trend }: SpendTrendProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3">
        Spending Trend ({period})
      </h2>

      <div className="space-y-3 text-sm">
        {trend.map((point, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-border pb-2"
          >
            <p className="text-gray-400">
              {new Date(point.date).toLocaleDateString("en-GB")}
            </p>
            <p className="text-white font-semibold">₹{point.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
