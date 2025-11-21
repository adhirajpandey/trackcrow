import { z } from "zod";
import { tool as createTool } from "ai";
import { validateSession } from "@/common/server";

/* ----------------------------- SCHEMA ----------------------------- */
const transactionSearchSchema = z.object({
  recipient: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  keyword: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */
async function runTransactionSearch(input: any) {
  const structured = "structured_data" in input ? input.structured_data : input;
  const { recipient, category, keyword, startDate, endDate } =
    transactionSearchSchema.parse(structured);

  const session = await validateSession();
  if (!session.success) {
    return { error: session.error || "User not authenticated." };
  }

  // 🧩 Combine recipient + keyword gracefully
  const queryTerms = [recipient, keyword]
    .filter((v) => v && v.trim().length > 0)
    .join(" ")
    .trim(); // e.g. "Shikaari’s petrol" or "Mondal ji"

  // 🧩 Construct base params
  const params = new URLSearchParams({
    page: "1",
    sortBy: "timestamp",
    sortOrder: "desc",
    month: "all",
  });

  if (queryTerms) params.set("q", queryTerms);
  if (category && category.trim()) params.set("category", category.trim());
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const baseUrl = "/transactions";
  const relativeUrl = `${baseUrl}?${params.toString()}`;

  const origin = process.env.NEXT_PUBLIC_APP_URL;

  const fullUrl = `${origin}${relativeUrl}`;

  console.log("✅ Transaction Search URL:", fullUrl);

  return {
    message: `Your filtered transactions are ready to view.`,
    searchUrl: fullUrl,
    filters: { recipient, category, keyword, startDate, endDate },
  };
}

/* ----------------------------- EXPORT TOOL ----------------------------- */
export const transactionSearchTool = createTool({
  name: "transactionSearch",
  description:
    "Builds a filtered transaction search link based on recipient, category, or date range.",
  inputSchema: transactionSearchSchema,
  execute: runTransactionSearch,
});
