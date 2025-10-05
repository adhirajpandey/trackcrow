import {
  UIMessage,
  convertToModelMessages,
  streamText,
  generateObject,
  createUIMessageStreamResponse,
  createUIMessageStream,
} from "ai";
import { getSessionUser, getUserCategories } from "@/common/server";
import { buildClassifierPrompt } from "@/common/prompts";
import { google } from "@ai-sdk/google";
import { tools } from "@/app/crow-bot/tools";
import { toolSchema } from "@/common/schemas";

interface StructuredData {
  amount: number | null;
  category: string | null;
  subcategory: string | null;
  date: string | null;
  description: string | null;
  month: string | null;
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const coreMessages = convertToModelMessages(messages);

    const lastMessage = messages[messages.length - 1];
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    const promptIntent =
      (lastMessage?.metadata as any)?.intent ||
      (lastUserMessage?.metadata as any)?.intent ||
      "other";

    const isResume =
      (lastMessage?.metadata as { resumeIntent?: boolean })?.resumeIntent ===
        true ||
      lastMessage?.parts?.some((p: any) => p.text?.includes('"__resume":true'));

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const lastHadToolOutput = lastAssistant?.parts?.some(
      (p: any) => p.type?.startsWith("tool-") && p.state === "output-available"
    );

    const userUuid = await getSessionUser();
    const categoriesContext = await getUserCategories(userUuid);

    const filteredMessages = coreMessages.filter(
      (m) =>
        !(
          m.role === "assistant" &&
          JSON.stringify(m).includes('"missing_fields"')
        )
    );

    if (isResume && !lastHadToolOutput) {
      const resumeText =
        lastMessage.parts?.find(
          (p): p is { type: "text"; text: string } => p.type === "text"
        )?.text || "{}";

      const parsedUserInput = JSON.parse(resumeText || "{}");

      const resumeState =
        (lastMessage.metadata as any)?.resumeState ||
        (parsedUserInput as any)?.resumeState ||
        {};

      const mergedData = {
        ...resumeState.context?.partialData,
        ...parsedUserInput,
      };

      const intent = resumeState.intent;

      let allowedTools: Record<string, any> = {};
      if (intent === "transaction") {
        allowedTools = {
          logExpense: tools.logExpense,
          showTransactions: tools.showTransactions,
          calculateTotalSpent: tools.calculateTotalSpent,
        };
      } else if (intent === "analytics") {
        allowedTools = {
          spendingTrend: tools.spendingTrend,
          lastMonthSummary: tools.lastMonthSummary,
          setBudget: tools.setBudget,
        };
      }

      const result = streamText({
        model: google("gemini-2.5-flash"),
        system:
          "You are a structured expense tracking assistant. Resume processing using provided merged data. Continue tool calls naturally based on structured data.",
        messages: [
          ...filteredMessages,
          {
            role: "assistant",
            content: `Continue from previous context using these merged details:\n${JSON.stringify(
              mergedData,
              null,
              2
            )}`,
          },
        ],
        tools: allowedTools,
      });

      return result.toUIMessageStreamResponse();
    }

    const classifierPrompt = buildClassifierPrompt(categoriesContext);

    const contextSwitch = {
      role: "system" as const,
      content: `The user is now in ${promptIntent.toUpperCase()} mode. 
      Ignore any previous mode context.`,
    };

    const structuredResObj = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: toolSchema,
      messages: [classifierPrompt, contextSwitch, ...coreMessages],
    });

    const structuredRes = structuredResObj.object;

    if (!structuredRes) {
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

    const { relevance, intent, structured_data } = structuredRes;

    let aiReportedMissingFields = [...structuredRes.missing_fields];

    const requiredFieldsByIntent: Record<string, string[]> = {
      setBudget: ["amount", "category"],
      logExpense: ["amount", "category"],
      calculateTotalSpent: ["category"],
      spendingTrend: ["category"],
    };

    const requiredFieldsForIntent = requiredFieldsByIntent[intent] || [];

    const missingFieldsForIntent = requiredFieldsForIntent.filter(
      (fieldName) => {
        const key = fieldName as keyof StructuredData;
        return !structured_data[key] || structured_data[key] === "null";
      }
    );

    if (missingFieldsForIntent.length && !aiReportedMissingFields.length) {
      aiReportedMissingFields = missingFieldsForIntent;
    }

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

    if (aiReportedMissingFields.length > 0) {
      const fieldsToAsk = aiReportedMissingFields;
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "start", messageId: id });
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              id,
              delta: JSON.stringify({
                type: "missing_fields",
                fields: fieldsToAsk.map((f) => ({
                  name: f,
                  label: f[0].toUpperCase() + f.slice(1),
                  type: f === "amount" ? "number" : "text",
                  required: true,
                })),
                resumeState: {
                  intent: promptIntent,
                  context: { partialData: structured_data },
                },
              }),
            });
            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `
        You are a structured expense tracking assistant.
        You must NOT send any text, explanations, or messages to the user.
        You are allowed to invoke tools ONLY.
        If no tool can be called, remain silent.
      `,
      messages: [
        ...coreMessages,
        {
          role: "assistant",
          content: `Process the following structured data silently:\n${JSON.stringify(
            structured_data,
            null,
            2
          )}`,
        },
      ],
      tools: allowedTools,
      maxOutputTokens: 1,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("POST /chat error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
