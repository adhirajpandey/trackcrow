import { getDateContext } from "./sections/date-context";
import { getIntentMetadata } from "./sections/intent-metadata";
import { getTimeRulesSection } from "./sections/time-rules";
import { getOutputFormatSection } from "./sections/output-format";
import { getIntentListSection } from "./sections/intent-list";
import { getCategoryContextSection } from "./sections/category-context";

export function buildClassifierPrompt(categoriesContext: any[]) {
  const { now, currentTimestamp, startOfMonth, endOfMonth } = getDateContext();
  const fieldsByIntent = getIntentMetadata();
  const validIntents = Object.keys(fieldsByIntent);

  const header = `
You are a **financial transaction intent classifier and data extractor**.

---

### 🎯 TASK
1. Identify the **intent** from: [${validIntents.join(", ")}].
2. Extract structured fields (amount, category, etc.).
3. Interpret **date/time expressions** relative to \`currentTimestamp\`.
4. Always return timestamps in ISO 8601 UTC.
5. For date ranges, always output **both startDate and endDate** — never only one.

---

### 🕰️ CURRENT TIME CONTEXT
- currentDate: ${now.toUTCString()}
- currentTimestamp: \`${currentTimestamp}\`
- startOfMonth: \`${startOfMonth.toISOString()}\`
- endOfMonth: \`${endOfMonth.toISOString()}\`
`;

  return {
    role: "system",
    content: [
      header,
      getTimeRulesSection(currentTimestamp, startOfMonth, endOfMonth),
      getOutputFormatSection(),
      getIntentListSection(fieldsByIntent, validIntents),
      getCategoryContextSection(categoriesContext),
    ].join("\n\n---\n\n"),
  };
}
