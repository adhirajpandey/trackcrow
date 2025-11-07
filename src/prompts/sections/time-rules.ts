export function getTimeRulesSection(
  currentTimestamp: string,
  startOfMonth: Date,
  endOfMonth: Date
) {
  return `
### 🕒 TIME RULES

#### 🧾 Timestamp Format
- All timestamps must be in **ISO 8601 UTC** format:  
  \`YYYY-MM-DDTHH:mm:ss.sssZ\`
- Example: \`2025-10-18T06:30:00.000Z\`
- Use UTC only; never use local or natural language time.
- Round inferred dates to logical hours (typically 12:00 UTC).

---

#### 🧩 For \`recordExpense\`
- Interpret relative references like “today”, “yesterday”, “last week”, “on 23rd”, “last Tuesday”, “in January 2024”.
- All such expressions are relative to the **current timestamp** below:
  - **currentTimestamp:** \`${currentTimestamp}\`
  - **currentMonthStart:** \`${startOfMonth.toISOString()}\`
  - **currentMonthEnd:** \`${endOfMonth.toISOString()}\`
- If no time reference is given → use the current timestamp as the transaction time.

---

#### 🧠 Temporal Inference Rules (Always Past)
- **Always interpret all time expressions as referring to the past.**
- If the referenced day/month has **not yet occurred** in the current calendar cycle, infer it from the **previous** one.
  - Example:
    - If current date = **2025-11-07**,  
      and user says **“on 25th”**, → interpret as **2025-10-25**, not 2025-11-25.
    - If user says **“on January 15”** but today is March 2025, → interpret as **2025-01-15** (past date).
    - If the phrase points to the future, shift backward to the **most recent past occurrence**.
- This rule ensures transactions are always **historical**, never future-dated.

---

#### 📊 For date-range intents (\`dashboardSummary\`, \`totalSpend\`, \`topExpense\`, \`expenseComparison\`)
- Interpret expressions like:
  - “this week”, “last week”, “this month”, “last month”, “past 7 days”, “in October”, “between Nov 1 and Nov 7”
- Always return **both** fields:
  - \`startDate\`: start of range at 00:00:00.000Z
  - \`endDate\`: end of range at 23:59:59.999Z
- Examples:
  - “this week” → both startDate and endDate for current week
  - “last 7 days” → start = 7 days ago, end = today
  - “October” → start = 2025-10-01T00:00:00.000Z, end = 2025-10-31T23:59:59.999Z
  - “from Nov 3 to Nov 9” → use exactly those bounds in UTC

---

#### ⏱ Temporal Consistency Rules
- If **startDate** is present → **endDate** must be present.
- If **endDate** is present → **startDate** must be present.
- For all relative or explicit date expressions, compute both.
- Never return only one of the pair — **both or none**.
`;
}
