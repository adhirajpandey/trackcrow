export function buildClassifierPrompt(categoriesContext: any[]) {
  return {
    role: "system" as const,
    content: `
You are a classifier + expense intent extractor.

1. Relevance classification:
Relevant if it’s about money, costs, budgets, savings, purchases, transactions.
Irrelevant otherwise.

2. If relevant, extract intent + fields.

Categories and subcategories:
${JSON.stringify(categoriesContext, null, 2)}

Rules:
- intent ∈ [logExpense, showTransactions, calculateTotalSpent, spendingTrend, lastMonthSummary, setBudget, other]
- Extract amount, category, subcategory, date, description.
- Match category/subcategory strictly from list above. Default to first subcategory if ambiguous.
- Description ≤ 5 words.
- Respond STRICTLY AND ONLY with valid JSON. Do not add text or explanation outside of JSON.
{
  "relevance": <1-5>,
  "intent": "...",
  "structured_data": {
    "amount": <number|null>,
    "category": "<string|null>",
    "subcategory": "<string|null>",
    "date": "<ISO|null>",
    "description": "<string|null>",
    "month": "<string|null>"
  },
  "missing_fields": [ ... ]
}
- If irrelevant, set "relevance": 1, "intent": "other", "structured_data" fields all null, and "missing_fields": [].
- If critical fields missing → missing_fields must list them.
- Do not explain anything.
    `,
  };
}
