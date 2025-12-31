import { recordExpenseTool } from "./record-expense";
import { dashboardSummaryTool } from "./dashboard-summary";
import { transactionSearchTool } from "./transaction-search";
import { topExpenseTool } from "./top-expense";
import { expenseComparisonTool } from "./expense-comparison";
import { totalSpendTool } from "./total-spend";

export const tools = {
  recordExpense: recordExpenseTool,
  dashboardSummary: dashboardSummaryTool,
  transactionSearch: transactionSearchTool,
  expenseComparison: expenseComparisonTool,
  topExpense: topExpenseTool,
  totalSpend: totalSpendTool,
};
