import { ArrowUpRight, Search } from "lucide-react";
import { useEffect } from "react";

type TransactionSearchProps = {
  message?: string;
  searchUrl: string;
};

export const TransactionSearchCard = ({
  message = "Your filtered transactions are ready to view.",
  searchUrl,
}: TransactionSearchProps) => {
  useEffect(() => {
    console.log("🔗 TransactionSearchCard received searchUrl:", searchUrl);
  }, [searchUrl]);

  const handleRedirect = () => {
    if (searchUrl) {
      window.open(searchUrl, "_blank", "noopener,noreferrer");
    } else {
      console.warn("⚠️ No searchUrl provided to TransactionSearchCard.");
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-border p-4 sm:px-8 sm:py-5 shadow-md flex flex-col gap-3 bg-background/40">
      <div className="flex items-center justify-between border-b border-border pb-2 sm:pb-3">
        <div className="flex items-center gap-2 text-gray-200">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          <h2 className="text-sm sm:text-base font-medium leading-tight">
            Transaction Search
          </h2>
        </div>

        <button
          onClick={handleRedirect}
          className="text-gray-400 hover:text-white transition-colors"
          title="Open filtered transactions in new tab"
        >
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
        {message}
      </p>
    </div>
  );
};
