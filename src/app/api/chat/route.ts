import {
  UIMessage,
  convertToModelMessages,
  generateObject,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { getSessionUser, getUserCategories } from "@/common/server";
import { buildClassifierPrompt } from "@/common/prompts";
import { google } from "@ai-sdk/google";
import { tools } from "@/app/crow-bot/tools";
import { toolSchema } from "@/common/schemas";
import {
  getCrowBotHelp,
  getTrackCrowHelp,
} from "@/app/crow-bot/utils/help-responses";
import { parseTimeframeFromText } from "@/app/crow-bot/utils/timeframe-parser";

/* ------------------------- Type Definitions -------------------------- */

type ResumeState = {
  intent?: keyof typeof tools;
  context?: {
    partialData?: Record<string, any>;
  };
};

type MessageWithMetadata = UIMessage & {
  metadata?: {
    intent?: string;
    resumeIntent?: boolean;
    resumeState?: ResumeState;
  };
};

type ToolName = keyof typeof tools;

/* ------------------------- Utility Functions -------------------------- */

function getRawTextFromUIMessage(msg?: UIMessage) {
  if (!msg) return "";
  return (
    msg.parts
      ?.filter((p: any) => p.type === "text" && p.text)
      .map((p: any) => p.text)
      .join("\n")
      .trim() || ""
  );
}

function deterministicIntentFromText(text: string) {
  const t = text?.toLowerCase().replace(/[^\w\s']/g, " ") || "";
  const patterns = {
    // “What is my biggest expense” type questions
    biggest:
      /\b(biggest|largest|most|top|highest|max|costliest|where did i spend the most|where most of my money went|what'?s my biggest expense|which category costs me the most)\b/,

    // Spending by category / trend breakdown
    breakdown:
      /\b(by category|each category|breakdown|distribution|split|per category|trend|trends|spending pattern|spending patterns|expense pattern|expense patterns|spending habit|spending habits|spending analysis|expense analysis|overview)\b/,

    // Month comparison
    lastMonth:
      /\b(last month|previous month|month summary|last month's|previous month's)\b/,

    // ✅ total spent / expenditure queries
    totalSpent:
      /\b(how much did i spend|total spent|total amount spent|how much have i spent|total expenditure|total expenses?)\b/,

    // ⚙️ record/log transactions — require *explicit action*
    logExpense:
      /\b(i\s+(spent|paid|bought)|add(ed)?\s+(an?\s+)?expense|log(ged)?\s+(an?\s+)?expense|record(ing)?\s+(an?\s+)?payment)\b/,
  };

  for (const [intent, regex] of Object.entries(patterns)) {
    if (regex.test(t)) {
      const map: Record<string, string> = {
        biggest: "biggestExpenseCategory",
        breakdown: "spendingTrendByCategory",
        lastMonth: "lastMonthVsThisMonth",
        totalSpent: "calculateTotalSpent",
        logExpense: "logExpense",
      };
      return { intent: map[intent], source: "rule" };
    }
  }
  return null;
}

function overrideIntentByKeywords(parsed: any, originalText: string) {
  const t = originalText?.toLowerCase().replace(/[^\w\s']/g, " ") || "";
  const checks = {
    biggest:
      /\b(biggest|largest|most|top|highest|max|costliest|where did i spend the most|where most of my money went|what'?s my biggest expense)\b/,
    breakdown:
      /\b(by category|each category|breakdown|distribution|split|per category)\b/,
    lastMonth:
      /\b(last month|previous month|month summary|last month's|previous month's)\b/,
  };

  if (checks.biggest.test(t)) {
    return {
      ...parsed,
      intent: "biggestExpenseCategory",
      relevance: Math.max(parsed.relevance || 3, 5),
      missing_fields: (parsed.missing_fields || []).filter(
        (f: string) => !["category", "amount"].includes(f)
      ),
      _override: "keyword-biggest",
    };
  }

  if (checks.breakdown.test(t))
    return {
      ...parsed,
      intent: "spendingTrendByCategory",
      relevance: 4,
      _override: "keyword-breakdown",
    };

  if (checks.lastMonth.test(t) && /biggest|most|where did i/i.test(t))
    return {
      ...parsed,
      intent: "biggestExpenseCategory",
      _override: "keyword-lastmonth+biggest",
    };

  return parsed;
}

async function extractFieldsForIntent(
  intent: string,
  rawText: string,
  coreMessages: any[]
) {
  return await generateObject({
    model: google("gemini-2.5-flash"),
    schema: toolSchema,
    messages: [
      {
        role: "system",
        content: `You are a JSON-only extractor. FORCE_INTENT: ${intent}. Extract fields as per schema.`,
      },
      { role: "user", content: rawText },
      ...coreMessages,
    ],
  });
}

/* -------------------------- Stream Utilities -------------------------- */

function streamTextResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const id = crypto.randomUUID();
        writer.write({ type: "start", messageId: id });
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
        writer.write({ type: "finish" });
      },
    }),
  });
}

function streamJSONResponse(payload: any) {
  return streamTextResponse(JSON.stringify(payload));
}

function streamToolResponse({
  toolName,
  tool,
  toolInput,
  executeArgs,
}: {
  toolName: string;
  tool: any;
  toolInput: any;
  executeArgs?: any;
}) {
  const toolCallId = crypto.randomUUID();
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({ type: "start-step" });
        writer.write({ type: "tool-input-start", toolCallId, toolName });
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName,
          input: toolInput,
        });

        try {
          const output = await tool.execute(executeArgs ?? toolInput);
          writer.write({ type: "tool-output-available", toolCallId, output });
        } catch (err: any) {
          writer.write({
            type: "text-delta",
            id: toolCallId,
            delta: `Tool "${toolName}" failed: ${err?.message || String(err)}`,
          });
        }

        writer.write({ type: "finish-step" });
        writer.write({ type: "finish" });
      },
    }),
  });
}

/* ----------------------------- POST Handler ------------------------------ */

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    const coreMessages = convertToModelMessages(messages);
    const lastMessage = messages.at(-1);
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const lastHadToolOutput = lastAssistant?.parts?.some(
      (p: any) => p.type?.startsWith("tool-") && p.state === "output-available"
    );

    const promptIntent =
      (lastMessage?.metadata as { intent?: string })?.intent ||
      (lastUserMessage?.metadata as { intent?: string })?.intent ||
      "other";

    const isResume =
      (lastMessage?.metadata as { resumeIntent?: boolean })?.resumeIntent ===
        true ||
      lastMessage?.parts?.some((p: any) => p.text?.includes('"__resume":true'));

    const userUuid = await getSessionUser();
    const categoriesContext = await getUserCategories(userUuid);

    /* ------------------------ Resume Handling ------------------------ */
    if (isResume && !lastHadToolOutput) {
      const lastMessage = (messages.at(-1) ?? {}) as MessageWithMetadata;

      const textPart = lastMessage.parts?.find(
        (p): p is { type: "text"; text: string } => p.type === "text"
      );
      const resumeText = textPart?.text ?? "{}";

      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(resumeText);
      } catch {
        parsed = {};
      }

      const resumeState: ResumeState =
        lastMessage.metadata?.resumeState ||
        (parsed.resumeState as ResumeState) ||
        {};

      const mergedData = {
        ...(resumeState.context?.partialData || {}),
        ...parsed,
      };

      const intent = resumeState.intent;
      const selectedTool = intent ? tools[intent] : undefined;

      if (!selectedTool)
        return streamTextResponse(
          `Sorry — I don't have a tool for intent "${intent}".`
        );

      if (!intent) {
        return streamTextResponse("Error: Missing intent for tool execution.");
      }

      return streamToolResponse({
        toolName: intent,
        tool: selectedTool,
        toolInput: { ...mergedData, userUuid },
        executeArgs: { structured_data: mergedData },
      });
    }

    /* ------------------------- Parse Input -------------------------- */
    const rawUserText = getRawTextFromUIMessage(lastUserMessage);

    /* -------------------- Help Intent Detection -------------------- */
    const helpRegex =
      /\b(what\s+is\s+trackcrow|what\s+can\s+trackcrow\s+do|trackcrow\s+help)\b/i;
    const crowBotHelpRegex =
      /\b(who\s+are\s+you|what\s+can\s+you\s+do|what\s+can\s+crowbot\s+do|tell\s+me\s+about\s+crowbot|crowbot\s+help|help|how\s+(do|can)\s+i\s+use|explain|guide|how\s+does\s+this\s+work|commands|features|capabilities)\b/i;

    if (helpRegex.test(rawUserText)) {
      return streamTextResponse(getTrackCrowHelp());
    }

    if (crowBotHelpRegex.test(rawUserText)) {
      return streamTextResponse(getCrowBotHelp());
    }

    /* ------------------------- Intent Detection ------------------------- */
    const rule = deterministicIntentFromText(rawUserText);
    let structuredResObj: any;

    if (rule) {
      structuredResObj = await extractFieldsForIntent(
        rule.intent,
        rawUserText,
        coreMessages
      );
      structuredResObj.object.intent = rule.intent;
      structuredResObj.object._intent_source = rule.source;
    } else {
      const classifierPrompt = buildClassifierPrompt(categoriesContext);
      structuredResObj = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: toolSchema,
        messages: [
          classifierPrompt,
          { role: "user", content: rawUserText },
          ...coreMessages,
        ],
      });
    }

    const structuredRes = structuredResObj?.object;
    if (!structuredRes)
      return streamTextResponse(`Oops, I couldn't understand your request.`);

    /* ---------------------- Post Processing ------------------------ */
    const finalParsed = overrideIntentByKeywords(structuredRes, rawUserText);
    if (finalParsed._override)
      console.log("Intent override applied:", finalParsed._override);
    if (finalParsed._intent_source === "rule" || finalParsed._override)
      finalParsed.relevance = 5;

    const { relevance, intent, structured_data } = finalParsed;
    let aiMissingFields = [...(finalParsed.missing_fields || [])];

    if (relevance <= 2)
      return streamTextResponse(
        [
          "Hmm, that doesn’t seem like an expense or analytics request.",
          "I couldn’t recognize this as an expense-related message.",
          "This doesn’t look like a valid expense or spending query.",
          "That doesn’t appear to be an expense or analytics command.",
        ][Math.floor(Math.random() * 4)]
      );

    const allowedByContext: Record<string, string[]> = {
      transaction: ["logExpense"],
      analytics: [
        "spendingTrendByCategory",
        "showTransactions",
        "calculateTotalSpent",
        "monthlyComparison",
        "biggestExpenseCategory",
        "setBudget",
        "lastMonthVsThisMonth",
      ],
    };

    const allowedIntents = allowedByContext[promptIntent] || [];
    if (!allowedIntents.includes(intent))
      return streamTextResponse(
        `You're in "${promptIntent}" mode but tried "${intent}". Please switch modes.`
      );

    const requiredByIntent: Record<string, string[]> = {
      logExpense: [
        "amount",
        "recipient",
        "category",
        "subcategory",
        "timestamp",
        "type",
      ],
      setBudget: ["amount", "category"],
      calculateTotalSpent: ["startDate", "endDate"],
      showTransactions: [],
      lastMonthVsThisMonth: [],
      spendingTrendByCategory: ["startDate", "endDate"],
      monthlyComparison: [],
      biggestExpenseCategory: ["startDate", "endDate"],
    };

    const requiredFields = requiredByIntent[intent] || [];
    const missing = requiredFields.filter(
      (f) => !structured_data?.[f] && structured_data?.[f] !== 0
    );
    aiMissingFields = Array.from(
      new Set([...aiMissingFields, ...missing])
    ).filter((f) => requiredFields.includes(f));

    if (
      [
        "spendingTrendByCategory",
        "lastMonthVsThisMonth",
        "biggestExpenseCategory",
      ].includes(intent) &&
      (!structured_data || Object.keys(structured_data).length === 0)
    ) {
      aiMissingFields = [];
    }

    if (aiMissingFields.length > 0) {
      return streamJSONResponse({
        type: "missing_fields",
        fields: aiMissingFields.map((f) => ({
          name: f,
          label: f[0].toUpperCase() + f.slice(1),
          type:
            f === "amount"
              ? "number"
              : f === "timestamp"
                ? "datetime-local"
                : "text",
          required: true,
        })),
        categories: categoriesContext,
        resumeState: { intent, context: { partialData: structured_data } },
      });
    }

    if (
      [
        "calculateTotalSpent",
        "spendingTrendByCategory",
        "biggestExpenseCategory",
      ].includes(intent)
    ) {
      const inferred = parseTimeframeFromText(rawUserText);

      if (inferred?.startDate && inferred?.endDate) {
        structured_data.startDate = inferred.startDate;
        structured_data.endDate = inferred.endDate;
        structured_data._timeframeInferred = true;
      } else {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        structured_data.startDate = start;
        structured_data.endDate = end;
        structured_data._timeframeInferred = false;
      }

      aiMissingFields = aiMissingFields.filter(
        (f) => f !== "startDate" && f !== "endDate"
      );
    }

    const selectedTool =
      intent && (intent as ToolName) in tools
        ? tools[intent as ToolName]
        : undefined;

    if (!selectedTool)
      return streamTextResponse(
        `Sorry — I don't have a tool for intent "${intent}".`
      );

    return streamToolResponse({
      toolName: intent,
      tool: selectedTool,
      toolInput: { ...(structured_data || {}), userUuid },
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized")
      return new Response("Unauthorized", { status: 401 });
    console.error("POST /chat error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
