import { google } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  createUIMessageStreamResponse,
  UIMessageChunk,
} from "ai";
import { tools } from "@/app/crow-bot/tools";

const schema: Record<string, string[]> = {
  log_expense: ["amount", "category", "subcategory", "date", "description"],
  show_expenses: [],
  show_summary: ["time_range"],
  set_budget: ["category", "amount", "time_range"],
};

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const coreMessages = convertToModelMessages(messages);

  const relevancePrompt = [
    {
      role: "system" as const,
      content: `
You are a classifier.
Decide if the user query is relevant to an expense tracker app.

Relevant if:
- It mentions money, amounts, costs, spending, purchases, bills, budgets, savings.
- It describes transactions (e.g., "I spent 200", "Dinner cost 3000").
- It asks for expense summaries or budgets.

Irrelevant if it's just casual text without any financial context.

Respond ONLY with a number from 1 (not relevant) to 5 (highly relevant).
      `,
    },
    ...coreMessages,
  ];

  const relevanceRes = await generateText({
    model: google("gemini-2.5-flash"),
    messages: relevancePrompt,
  });

  const score = parseInt(relevanceRes.text.trim(), 10);

  if (isNaN(score) || score < 4) {
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        const id = crypto.randomUUID();

        controller.enqueue({
          type: "text-start",
          id,
        });

        controller.enqueue({
          type: "text-delta",
          id,
          delta:
            "This query is not related to expense tracking. I can only help with expenses, transactions, budgets, and summaries.",
        });

        controller.enqueue({
          type: "text-end",
          id,
        });

        controller.close();
      },
    });

    return createUIMessageStreamResponse({ stream });
  }

  const intentPrompt = {
    role: "system" as const,
    content: `
You are an expense tracking assistant.
Identify the intent of the user query from these options:
- "log_expense" → adding a new expense
- "show_expenses" → listing or filtering expenses
- "show_summary" → daily/weekly/monthly summary
- "set_budget" → creating, updating, or controlling spending
- "other" → only if clearly unrelated to expense tracking

Respond in JSON ONLY:
{
  "intent": "<one of the options>",
  "structured_data": { ... },
  "missing_fields": [ ... ]
}
    `,
  };

  const intentRes = await generateText({
    model: google("gemini-2.5-flash-lite"),
    messages: [intentPrompt, ...coreMessages],
  });

  let parsed;
  try {
    parsed = JSON.parse(intentRes.text.trim());
  } catch {
    const match = intentRes.text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  }
  if (!parsed) {
    return new Response("Failed to parse intent JSON", { status: 500 });
  }

  const { intent, structured_data = {} } = parsed;
  if (intent === "other") {
    return new Response(
      "I understood your query, but it's not directly related to expense tracking.",
      { status: 200 }
    );
  }

  const required = schema[intent] || [];
  const missing_fields = required.filter((f) => !structured_data[f]);

  if (missing_fields.length > 0) {
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        const id = crypto.randomUUID();

        controller.enqueue({
          type: "text-start",
          id,
        });

        controller.enqueue({
          type: "text-delta",
          id,
          delta: `I need more details before proceeding. Please provide: ${missing_fields.join(", ")}.`,
        });

        controller.enqueue({
          type: "text-end",
          id,
        });

        controller.close();
      },
    });

    return createUIMessageStreamResponse({
      stream,
      headers: {
        "X-Pending-Intent": JSON.stringify({
          intent,
          structured_data,
          missing_fields,
        }),
      },
    });
  }

  const result = streamText({
    model: google("gemini-2.5-flash-lite"),
    system: "You are a friendly expense tracking assistant!",
    messages: coreMessages,
    stopWhen: stepCountIs(1),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
