import { google } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  convertToModelMessages,
  UIMessage,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { tools } from "@/app/crow-bot/tools";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

/* -------------------- Schemas -------------------- */
const ToolSchema = z.object({
  relevance: z.number().min(1).max(5),
  intent: z.enum([
    "logExpense",
    "showTransactions",
    "calculateTotalSpent",
    "spendingTrend",
    "lastMonthSummary",
    "setBudget",
    "other",
  ]),
  structured_data: z.object({
    amount: z.number().nullable(),
    category: z.string().nullable(),
    subcategory: z.string().nullable(),
    date: z.string().nullable(),
    description: z.string().nullable(),
    month: z.string().nullable(),
  }),
  missing_fields: z.array(z.string()),
});

/* -------------------- Helpers -------------------- */
async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uuid) {
    throw new Error("Unauthorized");
  }
  return session.user.uuid;
}

async function getCategories(userUuid: string) {
  const categories = await prisma.category.findMany({
    where: { user_uuid: userUuid },
    include: { Subcategory: true },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({
    name: c.name,
    subcategories: c.Subcategory.map((s) => s.name),
  }));
}

function buildClassifierPrompt(categoriesContext: any[]) {
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
- Respond ONLY with JSON:
{
  "relevance": <1-5>,
  "intent": "...",
  "structured_data": {
    "amount": <number|null>,
    "category": "<string|null>",
    "subcategory": "<string|null>",
    "date": "<ISO|null>",
    "description": "<string|null>"
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

function parseUnifiedResponse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return ToolSchema.parse(JSON.parse(match[0]));
  } catch (err) {
    console.error("❌ Failed to parse unified response:", {
      raw: text,
      error: err instanceof Error ? err.message : err,
    });
    return null;
  }
}

function validateCategoryData(structured: any, categories: any[]) {
  const category = categories.find(
    (c) => c.name.toLowerCase() === (structured.category || "").toLowerCase()
  );
  if (!category) return null;

  let subcategory = category.subcategories.find(
    (s: string) =>
      s.toLowerCase() === (structured.subcategory || "").toLowerCase()
  );
  if (!subcategory && category.subcategories.length > 0) {
    subcategory = category.subcategories[0];
  }

  return {
    ...structured,
    category: category.name,
    subcategory: subcategory || null,
  };
}

/* -------------------- Route Handler -------------------- */
export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    const coreMessages = convertToModelMessages(messages);

    const lastMessage = messages[messages.length - 1];
    const metadata = lastMessage.metadata as { intent?: string; url?: string };
    const promptIntent = metadata?.intent || "other";

    const userUuid = await getSessionUser();

    const categoriesContext = await getCategories(userUuid);

    const classifierPrompt = buildClassifierPrompt(categoriesContext);
    const unifiedRes = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [classifierPrompt, ...coreMessages],
    });

    const parsed = parseUnifiedResponse(unifiedRes.text);
    if (!parsed) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();

            writer.write({ type: "start", messageId: id });

            writer.write({ type: "text-start", id });

            writer.write({
              type: "text-delta",
              delta: `Oops, I couldn't understand your request. Could you please rephrase?`,
              id,
            });

            writer.write({ type: "text-end", id });

            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const { relevance, intent, structured_data, missing_fields } = parsed;

    if (relevance <= 2 && promptIntent) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();

            writer.write({ type: "start", messageId: id });

            writer.write({ type: "text-start", id });

            writer.write({
              type: "text-delta",
              delta: `This doesn’t look like an expense or financial request. Try asking about ${promptIntent}.`,
              id,
            });

            writer.write({ type: "text-end", id });

            writer.write({ type: "finish" });
          },
        }),
      });
    }

    let allowedTools: Record<string, any> = {};

    if (promptIntent === "transaction") {
      allowedTools = {
        logExpense: tools.logExpense,
        showTransactions: tools.showTransactions,
        calculateTotalSpent: tools.calculateTotalSpent,
      };
    } else if (promptIntent === "analytics") {
      allowedTools = {
        spendingTrend: tools.spendingTrend,
        lastMonthSummary: tools.lastMonthSummary,
        setBudget: tools.setBudget,
      };
    }

    if (!allowedTools[intent]) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();

            writer.write({ type: "start", messageId: id });

            writer.write({ type: "text-start", id });

            writer.write({
              type: "text-delta",
              delta: `Oops, I cannot perform this operation. Try asking about ${promptIntent}.`,
              id,
            });

            writer.write({ type: "text-end", id });

            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const needsCategory = [
      "logExpense",
      "showTransactions",
      "calculateTotalSpent",
    ].includes(intent);

    const validated = needsCategory
      ? validateCategoryData(structured_data, categoriesContext)
      : structured_data;

    if (
      (needsCategory && !validated) ||
      (missing_fields && missing_fields.length > 0)
    ) {
      let askFields = "";

      if (needsCategory && !validated) {
        const categoryExamples = categoriesContext
          .slice(0, 3)
          .map((c) => {
            const sub = c.subcategories?.slice(0, 2)?.join(", ") || "";
            return sub ? `${c.name}` : c.name;
          })
          .join(", ");

        askFields = `Please specify a valid category and subcategory from your saved list, such as ${categoryExamples}.`;
      } else if (missing_fields && missing_fields.length > 0) {
        askFields = `Please provide the following information to proceed: ${missing_fields.join(", ")}.`;
      } else {
        askFields = `Some required information is missing. Please clarify your request.`;
      }

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();

            writer.write({ type: "start", messageId: id });
            writer.write({ type: "text-start", id });

            writer.write({
              type: "text-delta",
              delta: askFields,
              id,
            });

            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system:
        "You are a structured expense tracking assistant. Respond with tool calls only.",
      messages: [
        ...coreMessages,
        {
          role: "assistant",
          content: `Use this validated structured data for processing, do not infer again:
${JSON.stringify(validated, null, 2)}`,
        },
      ],
      tools: allowedTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("POST /crow-bot error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
