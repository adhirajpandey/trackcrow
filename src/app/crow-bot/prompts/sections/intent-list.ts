export function getIntentListSection(
  fieldsByIntent: Record<string, any>,
  validIntents: string[]
) {
  return `
### 🧩 INTENTS
${validIntents
  .map((intent) => {
    const meta = fieldsByIntent[intent];
    return `
- **${intent}**
  - Description: ${meta.description}
  - Required: ${meta.required.join(", ") || "None"}
  - Optional: ${meta.optional.join(", ") || "None"}
  - Examples: ${meta.examples.join("; ")}
`;
  })
  .join("\n")}
`;
}
