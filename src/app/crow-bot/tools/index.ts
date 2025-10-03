import { logExpenseTool } from "./log-expense-tool";
import { showTransactionsTool } from "./show-transactions-tool";
import { calculateTotalSpentTool } from "./calculate-total-spent-tool";
import { spendingTrendTool } from "./spending-trend-tool";
import { lastMonthSummaryTool } from "./last-month-summary-tool";
import { setBudgetTool } from "./set-budget-tool";

export const tools = {
  logExpense: logExpenseTool,
  showTransactions: showTransactionsTool,
  calculateTotalSpent: calculateTotalSpentTool,
  spendingTrend: spendingTrendTool,
  lastMonthSummary: lastMonthSummaryTool,
  setBudget: setBudgetTool,
};
