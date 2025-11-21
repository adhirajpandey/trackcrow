export function getIntentMetadata() {
  return {
    recordExpense: {
      description: "Used to record a new expense transaction.",
      examples: [
        "I spent 200 on lunch today",
        "Add ₹500 to travel expenses yesterday",
        "Record a 1200 rupee grocery purchase on October 25th",
        "Bought a new phone last Sunday for 30000",
        "Spent 80 on metro pass last week",
      ],
      required: ["amount", "category", "timestamp"],
      optional: ["recipient", "subcategory", "type", "remarks"],
    },

    dashboardSummary: {
      description:
        "Used when the user asks for an overview, summary, or dashboard of their finances.",
      examples: [
        "Show me my expense dashboard for this month",
        "Where did I spend money last week?",
        "Dashboard summary between October 1 and October 15",
        "How much did I spend from November 3rd to November 9th?",
        "Expense overview for the past 7 days",
      ],
      required: [],
      optional: ["startDate", "endDate"],
    },

    expenseComparison: {
      description:
        "Used when the user wants to compare expenses between two categories, subcategories, or remarks.",
      examples: [
        "Compare food vs shopping expenses this month",
        "Compare groceries and travel from September 1 to September 30",
        "Compare Amazon vs Flipkart spending in October",
        "Compare rent vs electricity bills last month",
      ],
      required: ["comparisonKeyword1", "comparisonKeyword2"],
      optional: ["startDate", "endDate"],
    },

    transactionSearch: {
      description:
        "Used when the user wants to search or filter transactions — by recipient, category, or keyword.",
      examples: [
        "Transactions where recipient is Mondal Ji last month",
        "Show all dosa transactions between September 1 and September 15",
        "Find petrol spends this week",
        "All transactions from October 10 to October 20",
      ],
      required: [],
      optional: ["recipient", "category", "keyword", "startDate", "endDate"],
    },

    topExpense: {
      description:
        "Used when the user wants to identify their biggest or top spending.",
      examples: [
        "What is my biggest expense in June?",
        "Top expense this month",
        "Show me top spending between October 1 and October 31",
      ],
      required: [],
      optional: ["category", "startDate", "endDate"],
    },

    totalSpend: {
      description:
        "Used when the user wants to know total spending within a timeframe or for a specific category.",
      examples: [
        "How much did I spend on coffee this week?",
        "Total spend on Amazon in September",
        "Total expenses from November 1 to November 7",
        "My total grocery spend last month",
        "How much did I spend overall in October?",
      ],
      required: [],
      optional: ["category", "remarks", "startDate", "endDate"],
    },
  };
}
