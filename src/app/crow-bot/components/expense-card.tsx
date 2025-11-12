import { ArrowUpRight } from "lucide-react";

type ExpenseProps = {
  amount: number;
  recipient: string;
  recipient_name?: string;
  category: string;
  subcategory?: string;
  type?: string;
  timestamp: string;
  remarks?: string;
  message?: string;
  transactionId?: number;
};

export const ExpenseCard = ({
  amount,
  recipient,
  recipient_name,
  category,
  subcategory,
  type = "",
  timestamp,
  remarks,
  transactionId,
}: ExpenseProps) => {
  const formattedDate = new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const transactionUrl = `/transactions/${transactionId ?? recipient}`;

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-border px-8 py-6 shadow-md flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-base font-medium text-gray-300">
          Transaction Details
        </h2>
        <a
          href={transactionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
          title="Open transaction details in new tab"
        >
          <ArrowUpRight className="w-5 h-5" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-gray-400">Amount</p>
          <p className="text-lg font-semibold text-white">₹{amount}</p>
        </div>

        <div>
          <p className="text-gray-400">Recipient</p>
          <p className="text-lg font-semibold text-white">{recipient}</p>
        </div>

        <div>
          <p className="text-gray-400">Recipient Name</p>
          <p className="text-lg font-semibold text-white">
            {recipient_name ?? recipient}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Category</p>
          <p
            className="text-sm font-medium px-2 py-0.5 rounded-md inline-block"
            style={{ backgroundColor: "#75378d", color: "white" }}
          >
            {category}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Subcategory</p>
          <p className="text-lg font-semibold text-white">
            {subcategory && subcategory.trim() !== "" ? subcategory : "—"}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Type</p>
          <p className="text-lg font-semibold text-white">{type}</p>
        </div>

        <div>
          <p className="text-gray-400">Timestamp</p>
          <p className="text-lg font-semibold text-white">{formattedDate}</p>
        </div>
      </div>

      {remarks && (
        <div>
          <p className="text-gray-400">Remarks</p>
          <p className="text-white italic">“{remarks}”</p>
        </div>
      )}
    </div>
  );
};
