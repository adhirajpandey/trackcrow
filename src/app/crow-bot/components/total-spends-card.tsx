type TotalSpendsProps = {
  total: number;
  startDate?: string;
  endDate?: string;
};

export const TotalSpendsCard = ({
  total,
  startDate,
  endDate,
}: TotalSpendsProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3">
        Total Spent
      </h2>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-400">Amount</p>
          <p className="text-lg font-semibold text-white">₹{total}</p>
        </div>
        {startDate && endDate && (
          <div>
            <p className="text-gray-400">Period</p>
            <p className="text-lg font-semibold text-white">
              {new Date(startDate).toLocaleDateString("en-GB")} →{" "}
              {new Date(endDate).toLocaleDateString("en-GB")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
