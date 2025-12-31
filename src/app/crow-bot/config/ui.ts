export const CrowBotConfig = {
  prompts: {
    selectMode: "Please select Transaction or Analytics before starting.",
  },

  suggestions: {
    transaction: [
      "Add a new expense transaction",
      "Record a ₹500 grocery purchase",
      "Log yesterday’s cab ride",
    ],

    analytics: [
      "Show my expense summary for this month",
      "Compare groceries vs transport expenses in October",
      "What’s my biggest expense this week?",
      "Total amount spent on dinner last month",
      "Show all transactions with 'Starbucks' in remarks",
    ],
  },
};
