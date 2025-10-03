import { google } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  convertToModelMessages,
  UIMessage,
} from "ai";
import { tools } from "@/app/crow-bot/tools";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

/* -------------------- Schemas -------------------- */
const UnifiedSchema = z.object({
  relevance: z.number().min(1).max(5),
  intent: z.enum([
    "log_expense",
    "show_transactions",
    "calculate_total_spent",
    "spending_trend",
    "last_month_summary",
    "set_budget",
    "other",
  ]),
  structured_data: z.object({
    amount: z.number().nullable(),
    category: z.string().nullable(),
    subcategory: z.string().nullable(),
    date: z.string().nullable(),
    description: z.string().nullable(),
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
- intent ∈ [log_expense, show_expenses, show_summary, set_budget, other]
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
  },
  "missing_fields": [ ... ]
}
- If irrelevant → return {"relevance":1}
- If critical fields missing → missing_fields must list them.
- Do not explain anything.
    `,
  };
}

function parseUnifiedResponse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return UnifiedSchema.parse(JSON.parse(match[0]));
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

    // Step 1: Auth
    const userUuid = await getSessionUser();

    // Step 2: Categories
    const categoriesContext = await getCategories(userUuid);

    // Step 3: First LLM call (classification + structuring)
    const classifierPrompt = buildClassifierPrompt(categoriesContext);
    const unifiedRes = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [classifierPrompt, ...coreMessages],
    });

    const parsed = parseUnifiedResponse(unifiedRes.text);
    if (!parsed) return new Response("Aborted", { status: 204 });

    const { relevance, intent, structured_data, missing_fields } = parsed;

    if (relevance < 4 || intent === "other" || missing_fields.length > 0) {
      return new Response("Aborted", { status: 204 });
    }

    // Step 4: Validate category/subcategory
    const validated = validateCategoryData(structured_data, categoriesContext);
    if (!validated) return new Response("Aborted", { status: 204 });

    // Step 5: Second LLM call (tool execution)
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
      tools,
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
