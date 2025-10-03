type Transaction = {
  amount: number;
  category: string;
  date: string;
};

type ShowTransactionsProps = {
  transactions: Transaction[];
};

export const ShowTransactionsCard = ({
  transactions,
}: ShowTransactionsProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <h2 className="text-base font-medium text-gray-300 border-b border-border pb-3">
        Recent Transactions
      </h2>

      <div className="space-y-4 text-sm">
        {transactions.map((t, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-b border-border pb-2"
          >
            <div>
              <p className="text-white font-semibold">₹{t.amount}</p>
              <p className="text-gray-400">{t.category}</p>
            </div>
            <p className="text-gray-300 text-sm">
              {new Date(t.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
