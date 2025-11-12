import { z } from "zod";
import {
  UIMessage,
  convertToModelMessages,
  generateObject,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { getSessionUser, getUserCategories } from "@/common/server";
import { buildClassifierPrompt } from "@/prompts";
import { google } from "@ai-sdk/google";
import { tools } from "@/app/crow-bot/tools";
import { toolSchema } from "@/common/schemas";
import {
  getCrowBotHelp,
  getTrackCrowHelp,
} from "@/app/crow-bot/utils/help-responses";
import { getIntentMetadata } from "@/prompts/sections/intent-metadata";

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

async function extractFieldsForIntent(
  rawText: string,
  coreMessages: any[],
  classifierPrompt: any
) {
  const systemPrompt = `
You are a strict JSON generator. 
Return ONLY valid JSON matching the provided schema exactly. 
No text, no markdown, no commentary. 
If unsure, output an empty JSON matching the schema shape.
Each date must be a valid ISO 8601 UTC string (YYYY-MM-DDTHH:mm:ss.sssZ).

${classifierPrompt.content}
`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await generateObject({
        model: google("gemini-2.5-flash"),
        schema: toolSchema,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: rawText },
          ...coreMessages,
        ],
      });
    } catch (err: any) {
      if (String(err).includes("AI_NoObjectGeneratedError") && attempt === 1) {
        console.warn("Schema mismatch, retrying once...");
        continue;
      }
      throw err;
    }
  }
}

async function inferMissingDateRange({
  intent,
  structured_data,
  rawText,
  coreMessages,
}: {
  intent: string;
  structured_data: Record<string, any>;
  rawText: string;
  coreMessages: any[];
}) {
  const hasStart = !!structured_data?.startDate;
  const hasEnd = !!structured_data?.endDate;
  if (hasStart && hasEnd) return structured_data;

  const missingField = hasStart ? "endDate" : "startDate";
  const knownField = hasStart ? "startDate" : "endDate";
  const knownValue = structured_data[knownField];

  const inferencePrompt = `
You are a strict JSON generator.
Given the user's query and the known ${knownField} = "${knownValue}",
infer the missing ${missingField} so that the range represents a full logical period.
Follow these rules:
- Always use ISO 8601 UTC format.
- Never pick a future date.
- For expressions like "this week", "last month", "past 7 days", "today", etc.,
  ensure the range covers the full span of that duration.
- Return JSON only in this format:
  { "${missingField}": "YYYY-MM-DDTHH:mm:ss.sssZ" }

User query: "${rawText}"
`;

  try {
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        [missingField]: z
          .string()
          .regex(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            "Must be a valid ISO 8601 UTC timestamp"
          ),
      }),
      messages: [{ role: "system", content: inferencePrompt }, ...coreMessages],
    });

    const inferred = result?.object?.[missingField];
    if (inferred) {
      structured_data[missingField] = inferred;
      console.log(
        `[🧩 Auto-Inferred] ${missingField} = ${inferred} for intent "${intent}"`
      );
    }
  } catch (err) {
    console.warn(`Failed to infer ${missingField}:`, err);
  }

  return structured_data;
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
        return streamTextResponse(
          "Sorry, I couldn’t identify what you meant. Could you rephrase?"
        );
      }

      return streamToolResponse({
        toolName: intent,
        tool: selectedTool,
        toolInput: { ...mergedData, userUuid },
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

    const classifierPrompt = buildClassifierPrompt(categoriesContext);

    const structuredResObj = await extractFieldsForIntent(
      rawUserText,
      coreMessages,
      classifierPrompt
    );

    const structuredRes = structuredResObj?.object;
    if (!structuredRes)
      return streamTextResponse(`Oops, I couldn't understand your request.`);

    const { relevance, intent, structured_data } = structuredRes;

    if (
      [
        "totalSpend",
        "topExpense",
        "dashboardSummary",
        "expenseComparison",
        "transactionSearch",
      ].includes(intent)
    ) {
      const hasStart = !!structured_data?.startDate;
      const hasEnd = !!structured_data?.endDate;

      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        structuredRes.structured_data = await inferMissingDateRange({
          intent,
          structured_data,
          rawText: rawUserText,
          coreMessages,
        });
      }
    }

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
      transaction: ["recordExpense"],
      analytics: [
        "totalSpend",
        "topExpense",
        "expenseComparison",
        "transactionSearch",
        "dashboardSummary",
      ],
    };

    console.log(structuredRes);

    const allowedIntents = allowedByContext[promptIntent] || [];
    const intentMode =
      Object.entries(allowedByContext).find(([, intents]) =>
        intents.includes(intent)
      )?.[0] || "unknown";

    if (!allowedIntents.includes(intent)) {
      const correctMode =
        intentMode === "transaction"
          ? "a transaction action"
          : intentMode === "analytics"
            ? "an analytics query"
            : "a different type of command";

      return streamTextResponse(
        `You're in "${promptIntent}" mode but asked for ${correctMode}. Please switch to the ${intentMode} mode to continue.`
      );
    }
    const allIntents = getIntentMetadata();
    const intentMeta = (intent &&
      allIntents[intent as keyof typeof allIntents]) || {
      required: [],
      optional: [],
    };

    const requiredFields = intentMeta.required || [];
    const optionalFields = intentMeta.optional || [];

    const missingRequired = requiredFields.filter(
      (f: any) => !structured_data?.[f] && structured_data?.[f] !== 0
    );

    if (missingRequired.length > 0) {
      return streamJSONResponse({
        type: "missing_fields",
        fields: missingRequired.map((f: any) => ({
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
