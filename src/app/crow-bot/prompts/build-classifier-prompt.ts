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
You are an AI system that must output **only valid JSON**, with:
- no markdown
- no extra text
- no comments  
If unsure, output an empty JSON structure matching the expected schema.
All dates must use **ISO 8601 UTC** (YYYY-MM-DDTHH:mm:ss.sssZ).

Your primary role is to **classify financial intent** and **extract structured fields** from the user's message.

### TASKS
1. Determine the intent from this list: [${validIntents.join(", ")}].
2. Extract structured fields (amount, category, date ranges, etc.).
3. Resolve natural language dates using \`currentTimestamp\`.
4. Always return:
   - \`startDate\`
   - \`endDate\`
   If only one is mentioned, infer the other logically.
5. If the message is unrelated to expenses/analytics:
   - set \`intent = "other"\`
   - set \`relevance = 0\`
   - structured fields must be empty.

### TIME CONTEXT
- currentDate: ${now.toUTCString()}
- currentTimestamp: "${currentTimestamp}"
- startOfMonth: "${startOfMonth.toISOString()}"
- endOfMonth: "${endOfMonth.toISOString()}"
`;

  const body = [
    getTimeRulesSection(currentTimestamp, startOfMonth, endOfMonth),
    getOutputFormatSection(),
    getIntentListSection(fieldsByIntent, validIntents),
    getCategoryContextSection(categoriesContext),
  ].join("\n\n---\n\n");

  return {
    role: "system",
    content: `${header}\n\n---\n\n${body}`,
  };
}
