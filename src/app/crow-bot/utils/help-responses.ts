// app/crow-bot/help-responses.ts

function pickRandom(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}

/** -------------------------
 *  CrowBot Help Responses
 *  -------------------------
 */
export function getCrowBotHelp(): string {
  const responses = [
    [
      "👋 Hi there! I’m **CrowBot**, your AI-powered expense assistant.",
      "",
      "I can help you with everything from recording expenses to analyzing spending trends.",
      "",
      "Here’s what I can do:",
      "- 🧾 Record new expenses automatically.",
      "- 📊 Show detailed dashboard summaries.",
      "- ⚖️ Compare spending between categories or remarks.",
      "- 🔍 Search specific transactions.",
      "- 🏆 Identify your biggest expense.",
      "- 💰 Calculate your total spend for any period.",
      "",
      "Just type your request and I’ll handle the rest instantly ⚡",
    ].join("\n"),

    [
      "Hey 👋 I’m **CrowBot**, part of the **TrackCrow** platform.",
      "",
      "You can use me to:",
      "- Add or log expenses 💸",
      "- View analytics & summaries 📈",
      "- Compare categories or remarks for a specific timeframe ⚖️",
      "- Search past transactions 🔍",
      "- Find your top expense 🏆",
      "- Check total spending 💰",
      "",
      "I help you manage and analyze your expenses efficiently 🚀",
    ].join("\n"),
  ];

  return pickRandom(responses);
}

/** -------------------------
 *  TrackCrow Help Responses
 *  -------------------------
 */
export function getTrackCrowHelp(): string {
  const responses = [
    [
      "🪶 **TrackCrow** is your all-in-one smart expense tracker powered by CrowBot.",
      "",
      "It helps you:",
      "- Log and organize expenses automatically.",
      "- Visualize spending patterns and trends.",
      "- Compare categories or custom date ranges.",
      "- Discover your top expenses instantly.",
      "- Generate summaries — no spreadsheets needed!",
      "",
      "TrackCrow gives you clear insights and smarter control over your finances 💡",
    ].join("\n"),

    [
      "✨ **TrackCrow** combines automation + AI to make expense tracking effortless.",
      "",
      "It supports:",
      "- Adding and categorizing expenses 🧾",
      "- Generating dashboards 📊",
      "- Comparing spending between areas ⚖️",
      "- Finding trends and top expenses 🏆",
      "- Calculating totals over any period 💰",
      "",
      "**CrowBot + TrackCrow** give you financial clarity with zero manual effort 🚀",
    ].join("\n"),
  ];

  return pickRandom(responses);
}
