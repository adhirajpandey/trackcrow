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
      "👋 Hey there! I’m **CrowBot**, your personal expense assistant.",
      "",
      "Here’s what I can help you with:",
      "- 💸 **Add expenses** — e.g., “I spent ₹500 on lunch.”",
      "- 📊 **View analytics** — e.g., “Show my spending by category.”",
      "- 🏆 **Find insights** — e.g., “What’s my biggest expense category?”",
      "- ⏱️ **Compare months** — e.g., “Compare last month and this month.”",
      "- 💰 **Calculate totals** — e.g., “How much did I spend this week?”",
      "",
      "You can chat with me in plain English — I’ll figure it out for you! 😄",
    ].join("\n"),

    [
      "Hey 👋 I’m **CrowBot**, part of **TrackCrow** — I help you manage and analyze your spending.",
      "",
      "You can ask me things like:",
      "- “Add ₹200 grocery expense.”",
      "- “What did I spend most on last month?”",
      "- “Show expenses by category.”",
      "- “How much did I spend this week?”",
      "",
      "Think of me as your smart finance companion 🧠",
    ].join("\n"),

    [
      "👋 Hi! I’m **CrowBot**, here to make your money tracking effortless.",
      "",
      "Try saying:",
      "- “Log ₹400 spent on travel.”",
      "- “What’s my top expense this month?”",
      "- “Show my spending breakdown.”",
      "- “Compare my last two months.”",
      "",
      "Basically — if it’s about your expenses, I’ve got you covered 💪",
    ].join("\n"),

    [
      "Hey there! 🐦 I’m **CrowBot**, your AI companion for **TrackCrow**.",
      "",
      "I can help you:",
      "- Record transactions 🧾",
      "- Analyze your spending habits 📊",
      "- Find your biggest categories 🏆",
      "- Compare time periods 📆",
      "- Or just explore trends 👀",
      "",
      "Start with something simple — like *“Show me my expenses for last week.”*",
    ].join("\n"),

    [
      "Hi 👋 I’m **CrowBot**, built to make tracking expenses effortless.",
      "",
      "I handle:",
      "- Adding transactions 💸",
      "- Showing insights 📈",
      "- Finding trends 🔍",
      "- Comparing months ⏱️",
      "",
      "You can type in natural language — I’ll figure out what you mean!",
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
      "- Log and organize daily transactions automatically.",
      "- Visualize where your money goes — by category, recipient, or time.",
      "- Compare spending trends between months.",
      "- Discover your biggest spending areas instantly.",
      "- And generate clean summaries & reports — no spreadsheets needed!",
      "",
      "In short: **TrackCrow = smart insights + zero manual effort.** 🧠",
    ].join("\n"),

    [
      "**TrackCrow** helps you stay on top of your finances effortlessly.",
      "",
      "You can use it to:",
      "- Add or log expenses 💳",
      "- View analytics & charts 📊",
      "- Find your biggest expense categories 🏆",
      "- Track budgets and goals 🎯",
      "- Compare months or custom ranges ⏱️",
      "",
      "It’s designed for people who want clarity, not complexity.",
    ].join("\n"),

    [
      "✨ **TrackCrow** turns your transactions into insights.",
      "",
      "It’s built to:",
      "- Auto-categorize your expenses.",
      "- Help you understand spending habits.",
      "- Give smart summaries like “Where did I spend the most?”",
      "- Compare this month vs last month instantly.",
      "",
      "All powered by CrowBot’s AI magic 🤖💡",
    ].join("\n"),

    [
      "🧭 Meet **TrackCrow**, your smart expense-tracking dashboard.",
      "",
      "It combines simplicity + intelligence:",
      "- Record payments easily.",
      "- Visualize data beautifully.",
      "- Get AI insights on your habits.",
      "- And make better financial decisions, fast.",
      "",
      "Ask CrowBot about TrackCrow anytime to get started!",
    ].join("\n"),

    [
      "💡 **TrackCrow** is an intelligent expense analysis system built for effortless finance tracking.",
      "",
      "Think of it as your personal spending assistant that:",
      "- Logs and categorizes every transaction.",
      "- Highlights top spending areas.",
      "- Provides spending trends & visual insights.",
      "- Keeps your financial overview clean and simple.",
      "",
      "All through natural conversation — powered by CrowBot 🐦",
    ].join("\n"),
  ];

  return pickRandom(responses);
}
