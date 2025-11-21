export function getOutputFormatSection() {
  return `
### ⚙️ OUTPUT FORMAT

Return strictly valid JSON only.

For single-timestamp intents:
\`\`\`json
{
  "intent": "recordExpense",
  "relevance": 5,
  "structured_data": {
    "amount": 300,
    "category": "Gadgets",
    "timestamp": "2025-10-18T06:30:00.000Z"
  },
  "missing_fields": []
}
\`\`\`

For date-range intents:
\`\`\`json
{
  "intent": "totalSpend",
  "relevance": 5,
  "structured_data": {
    "category": "Food",
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-07T23:59:59.999Z"
  },
  "missing_fields": []
}
\`\`\`
`;
}
