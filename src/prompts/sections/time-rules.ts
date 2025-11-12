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
- Use **UTC only**; never use local or relative language like “morning” or “evening”.
- Round inferred dates to logical hours (typically 12:00 UTC).

---

#### 🧠 Temporal Inference Rules (Always Past)
- Always interpret all time expressions as referring to the **past**.
- If a date or month mentioned has not yet occurred in the current cycle, infer it from the **previous** one.
  - Example:
    - Current date = **2025-11-07**
      - “on 25th” → **2025-10-25**
      - “in January” → **2025-01-01T00:00:00.000Z**
- If any expression points to the future, adjust backward to the **most recent past occurrence**.

---

#### 🧩 For \`recordExpense\`
- Interpret natural references like “today”, “yesterday”, “last week”, “on 23rd”, “last Tuesday”, “in January 2024”.
- All such expressions are relative to:
  - **currentTimestamp:** \`${currentTimestamp}\`
  - **currentMonthStart:** \`${startOfMonth.toISOString()}\`
  - **currentMonthEnd:** \`${endOfMonth.toISOString()}\`
- If no time reference is given → use the **current timestamp** as the transaction time.

---

#### 📊 Conditional Date Range Extraction Rules
- \`startDate\` and \`endDate\` are **optional overall**,  
  but if the user input **mentions or implies any range, duration, or time window**,  
  you must output **both startDate and endDate**.
- Valid range indicators include phrases like:
  - “this week”, “last week”, “this month”, “last month”
  - “past 7 days”, “between Nov 1 and Nov 7”, “in October”, “from Monday to Sunday”
- Examples:
  - “this week” → startDate = Monday 00:00Z, endDate = Sunday 23:59Z
  - “last 7 days” → startDate = 7 days before now, endDate = now
  - “October” → startDate = 2025-10-01T00:00:00.000Z, endDate = 2025-10-31T23:59:59.999Z
  - “from Nov 3 to Nov 9” → use exactly those bounds in UTC

---

#### 📅 Field Consistency Rules
- If **startDate** is present → **endDate** must also be present.
- If **endDate** is present → **startDate** must also be present.
- Never output only one of the pair — **always both or none**.
- If no timeframe is implied → omit both fields.
- This rule applies to all date-range intents:
  \`dashboardSummary\`, \`totalSpend\`, \`topExpense\`, \`expenseComparison\`, and similar.

---

#### ⏱ Temporal Consistency & Validation
- Always ensure that:
  - \`startDate <= endDate\`
  - All inferred dates are in the **past** relative to \`${currentTimestamp}\`.
- If the user mentions ambiguous terms like “this week” or “last month”,
  resolve them based on the current timestamp and month boundaries above.

### ⚖️ CONDITIONAL FIELD ENFORCEMENT

- The fields \`startDate\` and \`endDate\` are optional overall,
  but they are **conditionally required together**.

- If the user query contains any time-based or duration-based phrase,
  such as:
  “this week”, “last month”, “past 7 days”, “today”, “yesterday”, “from ... to ...”,
  then you MUST output **both startDate and endDate** in ISO 8601 UTC format.

- If the user provides only a single-day reference like "today" or "yesterday",
  infer startDate as 00:00:00.000Z and endDate as 23:59:59.999Z for that day.

- Do not output only one of them under any circumstance.
- If no date or timeframe is implied at all → omit both.
`;
}
