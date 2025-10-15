import { logExpenseTool } from "./log-expense-tool";
import { showTransactionsTool } from "./show-transactions-tool";
import { calculateTotalSpentTool } from "./calculate-total-spent-tool";
import { lastMonthVsThisMonthTool } from "./last-month-vs-this-month-tool";
import { setBudgetTool } from "./set-budget-tool";
import { biggestExpenseCategoryTool } from "./biggest-expense-tool";
import { spendingTrendByCategoryTool } from "./spending-trend-by-category-tool";

export const tools = {
  logExpense: logExpenseTool,
  showTransactions: showTransactionsTool,
  calculateTotalSpent: calculateTotalSpentTool,
  lastMonthVsThisMonth: lastMonthVsThisMonthTool,
  setBudget: setBudgetTool,
  biggestExpenseCategory: biggestExpenseCategoryTool,
  spendingTrendByCategory: spendingTrendByCategoryTool,
};
