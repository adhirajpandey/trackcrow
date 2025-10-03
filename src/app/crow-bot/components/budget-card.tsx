type BudgetProps = {
  category: string;
  budget: number;
  status: string;
};

export const BudgetCard = ({ category, budget, status }: BudgetProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3">
        Budget Status
      </h2>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-gray-400">Category</p>
          <p className="text-lg font-semibold text-white">{category}</p>
        </div>

        <div>
          <p className="text-gray-400">Budget</p>
          <p className="text-lg font-semibold text-white">₹{budget}</p>
        </div>
      </div>

      <div>
        <p className="text-gray-400">Status</p>
        <p className="text-white italic">{status}</p>
      </div>
    </div>
  );
};
