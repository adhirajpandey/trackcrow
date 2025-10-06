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
      const selectedTool = tools[intent];
      const toolCallId = crypto.randomUUID();

      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({ type: "start" });
            writer.write({ type: "start-step" });
            writer.write({
              type: "tool-input-start",
              toolCallId,
              toolName: intent,
            });
            writer.write({
              type: "tool-input-available",
              toolCallId,
              toolName: intent,
              input: mergedData,
            });

            try {
              const output = await selectedTool.execute(mergedData);
              writer.write({
                type: "tool-output-available",
                toolCallId,
                output,
              });
            } catch (err: any) {
              writer.write({
                type: "text-delta",
                id: toolCallId,
                delta: `Tool "${intent}" failed: ${err.message}`,
              });
            }

            writer.write({ type: "finish-step" });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const classifierPrompt = buildClassifierPrompt(categoriesContext);
    const contextSwitch = {
      role: "system" as const,
      content: `The user is now in ${promptIntent.toUpperCase()} mode. Ignore previous context.`,
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
    let aiReportedMissingFields = [...(structuredRes.missing_fields || [])];

    if (relevance <= 2) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "start", messageId: id });
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              delta: `This doesn’t look like a valid expense or analytics request.`,
              id,
            });
            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const allowedIntentsByContext: Record<string, string[]> = {
      transaction: ["logExpense", "showTransactions", "calculateTotalSpent"],
      analytics: ["spendingTrend", "lastMonthSummary", "setBudget"],
    };

    const detectedIntentGroup =
      Object.entries(allowedIntentsByContext).find(([_, intents]) =>
        intents.includes(intent)
      )?.[0] || "other";

    const allowedIntents = allowedIntentsByContext[promptIntent] || [];

    if (!allowedIntents.includes(intent)) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "start", messageId: id });
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              delta: `You're in "${promptIntent}" mode, but tried to perform an action from "${detectedIntentGroup}". Please switch modes.`,
              id,
            });
            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const requiredFieldsByIntent: Record<string, string[]> = {
      setBudget: ["amount", "category"],
      logExpense: ["amount", "category", "subcategory", "date", "description"],
      calculateTotalSpent: ["category"],
      spendingTrend: ["category"],
      showTransactions: [],
      lastMonthSummary: [],
    };

    const requiredFieldsForIntent = requiredFieldsByIntent[intent] || [];

    const missingFieldsForIntent = requiredFieldsForIntent.filter(
      (fieldName) => {
        const key = fieldName as keyof StructuredData;
        const val = structured_data?.[key];
        return (
          val === null || val === undefined || val === "" || val === "null"
        );
      }
    );

    if (missingFieldsForIntent.length && !aiReportedMissingFields.length) {
      aiReportedMissingFields = missingFieldsForIntent;
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
                categories: categoriesContext,
                resumeState: {
                  intent,
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

    const selectedTool = tools[intent];
    if (!selectedTool?.execute) {
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            const id = crypto.randomUUID();
            writer.write({ type: "start", messageId: id });
            writer.write({ type: "text-start", id });
            writer.write({
              type: "text-delta",
              delta: `No tool found for "${intent}".`,
              id,
            });
            writer.write({ type: "text-end", id });
            writer.write({ type: "finish" });
          },
        }),
      });
    }

    const toolCallId = crypto.randomUUID();

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute: async ({ writer }) => {
          writer.write({ type: "start" });
          writer.write({ type: "start-step" });
          writer.write({
            type: "tool-input-start",
            toolCallId,
            toolName: intent,
          });
          writer.write({
            type: "tool-input-available",
            toolCallId,
            toolName: intent,
            input: structured_data,
          });

          try {
            const output = await selectedTool.execute(structured_data);
            writer.write({
              type: "tool-output-available",
              toolCallId,
              output,
            });
          } catch (err: any) {
            writer.write({
              type: "text-delta",
              id: toolCallId,
              delta: `Tool "${intent}" failed: ${err.message}`,
            });
          }

          writer.write({ type: "finish-step" });
          writer.write({ type: "finish" });
        },
      }),
    });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("POST /chat error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
