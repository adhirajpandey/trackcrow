import { Wallet2 } from "lucide-react";
import { StructuredDataCard } from "./structured-data-card";

type TotalSpendCardProps = {
  message: string;
  result?: {
    totalSpent: number;
    category?: string | null;
    subcategory?: string | null;
    remarks?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
};

export const TotalSpendCard = ({ message, result }: TotalSpendCardProps) => {
  if (!result) {
    return (
      <StructuredDataCard
        title="Total Spend"
        icon={<Wallet2 className="w-6 h-6 text-blue-400" />}
      >
        <p className="text-gray-400 text-sm italic text-center">{message}</p>
      </StructuredDataCard>
    );
  }

  const { totalSpent, category, subcategory, remarks, startDate, endDate } =
    result;

  const dateRange =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-IN")} — ${new Date(
          endDate
        ).toLocaleDateString("en-IN")}`
      : "All Time";

  return (
    <StructuredDataCard
      title="Total Spend"
      icon={<Wallet2 className="w-6 h-6 text-blue-400" />}
      dateRange={dateRange}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          {category && (
            <p className="text-sm text-gray-400">
              Category:{" "}
              <span className="text-white font-medium">{category}</span>
            </p>
          )}

          {subcategory && (
            <p className="text-sm text-gray-400 mt-1">
              Subcategory:{" "}
              <span className="text-white font-medium">
                &quot;{subcategory}&quot;
              </span>
            </p>
          )}

          {remarks && (
            <p className="text-sm text-gray-400 mt-1">
              Filter:{" "}
              <span className="text-white font-medium">
                &quot;{remarks}&quot;
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">Total Spent:</p>
          <p className="text-2xl font-bold text-blue-400 tracking-tight ml-2">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </StructuredDataCard>
  );
};
