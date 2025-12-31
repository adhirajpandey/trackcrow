import { UIMessage, convertToModelMessages } from "ai";
import { getSessionUser, getUserCategories } from "@/common/server";
import { buildClassifierPrompt } from "@/app/crow-bot/prompts";
import { tools } from "@/app/crow-bot/tools";
import {
  getCrowBotHelp,
  getTrackCrowHelp,
} from "@/app/crow-bot/utils/help-responses";
import { getIntentMetadata } from "@/app/crow-bot/prompts/sections/intent-metadata";

import {
  streamTextResponse,
  streamToolResponse,
  streamJSONResponse,
} from "@/app/crow-bot/utils/stream-utilities";

import {
  getRawTextFromUIMessage,
  extractFieldsForIntent,
  extractMissingDateRange,
} from "@/app/crow-bot/utils/extraction-utilities";

import {
  HELP_REGEX,
  CROWBOT_HELP_REGEX,
  EXPENSE_IRRELEVANT_RESPONSES,
  ALLOWED_BY_CONTEXT,
  SCHEMA_FAILURE_KEYWORDS,
  ERROR_MESSAGES,
  DATE_RANGE_INTENTS,
  FIELD_TYPES,
  DEFAULT_FIELD_TYPE,
  HTTP_ERRORS,
  SERVER_OVERLOADED_MESSAGE
} from "@/app/crow-bot/config/server-config";

import { isApiExhaustionError } from "@/app/crow-bot/utils/error-detection";

import { logger } from "@/lib/logger";

/* ------------------------- Types -------------------------- */
type ResumeState = {
  intent?: keyof typeof tools;
  context?: { partialData?: Record<string, any> };
};

type MessageWithMetadata = UIMessage & {
  metadata?: {
    intent?: string;
    hidden?: boolean;
    resumeIntent?: boolean;
    resumeState?: ResumeState;
  };
};

type ToolName = keyof typeof tools;

export async function POST(request: Request) {
  try {
    logger.info("POST /api/chat - Request received");

    const { messages }: { messages: UIMessage[] } = await request.json();

    logger.debug("POST /api/chat - Messages received", {
      messageCount: messages.length,
      lastRole: messages.at(-1)?.role,
    });

    const coreMessages = convertToModelMessages(messages);
    const lastMessage = messages.at(-1);
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");

    const rawUserText = getRawTextFromUIMessage(lastUserMessage);

    const lastHadToolOutput = lastAssistant?.parts?.some(
      (p: any) => p.type?.startsWith("tool-") && p.state === "output-available"
    );

    const isResume =
      (lastMessage?.metadata as any)?.resumeIntent === true ||
      lastMessage?.parts?.some((p: any) => p.text?.includes('"__resume":true'));

    logger.debug("POST /api/chat - Resume evaluation", {
      isResume,
      lastHadToolOutput,
    });

    if (isResume && !lastHadToolOutput) {
      logger.info("POST /api/chat - Resuming previous intent");

      const msg = lastMessage as MessageWithMetadata;

      const textPart = msg.parts?.find(
        (p): p is { type: "text"; text: string } => p.type === "text"
      );

      const resumeText = textPart?.text ?? "{}";

      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(resumeText);
      } catch {logger.warn("POST /api/chat - Resume JSON parse failed");}

      const resumeState: ResumeState =
        msg.metadata?.resumeState || parsed.resumeState || {};

      const mergedData = {
        ...(resumeState.context?.partialData || {}),
        ...parsed,
      };

      const intent = resumeState.intent;
      const selectedTool = intent ? tools[intent] : undefined;

      if (!intent) {
        logger.warn("POST /api/chat - Resume failed: intent missing");
        return streamTextResponse(
          "Sorry — I couldn't identify what you meant. Try again?"
        );
      }

      if (!selectedTool) {
        logger.error(
          "POST /api/chat - Resume failed: tool not found",
          undefined,
          { intent }
        );
        return streamTextResponse(
          `Sorry — I don't have a tool for intent "${intent}".`
        );
      }

      const userUuid = await getSessionUser();
      logger.info("POST /api/chat - Resume tool execution", {
        userUuid,
        intent,
      });

      return streamToolResponse({
        toolName: intent,
        tool: selectedTool,
        toolInput: { ...mergedData, userUuid },
      });
    }

    /* ---------------- Help shortcuts ---------------- */
    if (HELP_REGEX.test(rawUserText)) {
      logger.debug("POST /api/chat - TrackCrow help triggered");
      return streamTextResponse(getTrackCrowHelp());
    }

    if (CROWBOT_HELP_REGEX.test(rawUserText)) {
      logger.debug("POST /api/chat - CrowBot help triggered");
      return streamTextResponse(getCrowBotHelp());
    }

    /* ---------------- User & categories ---------------- */
    const userUuid = await getSessionUser();
    logger.info("POST /api/chat - User resolved", { userUuid });

    const categories = await getUserCategories(userUuid);
    logger.debug("POST /api/chat - Categories fetched", {
      userUuid,
      count: categories.length,
    });

    /* ---------------- Intent extraction ---------------- */
    let structuredResObj;
    try {
      structuredResObj = await extractFieldsForIntent(
        rawUserText,
        coreMessages,
        buildClassifierPrompt(categories)
      );
    } catch (err: any) {
      logger.error(
        "POST /api/chat - Intent extraction failed",
        err as Error,
        { userUuid }
      );

      const msg = String(err);
      if (SCHEMA_FAILURE_KEYWORDS.some((k) => msg.includes(k))) {
        return streamTextResponse(ERROR_MESSAGES.schemaFailure);
      }
      throw err;
    }


    const structured = structuredResObj?.object;
    if (!structured) {
      logger.warn("POST /api/chat - Empty structured intent", {
        userUuid,
      });
      return streamTextResponse(ERROR_MESSAGES.couldNotUnderstand);
    }

    const { relevance, intent, structured_data = {} } = structured;

    logger.info("POST /api/chat - Intent classified", {
      userUuid,
      intent,
      relevance,
    });

    if (relevance <= 2) {
      logger.debug("POST /api/chat - Low relevance input", {
        userUuid,
        relevance,
      });
      return streamTextResponse(
        EXPENSE_IRRELEVANT_RESPONSES[
          Math.floor(Math.random() * EXPENSE_IRRELEVANT_RESPONSES.length)
        ]
      );
    }

    if (DATE_RANGE_INTENTS.includes(intent as any)) {
      const hasStart = !!structured_data.startDate;
      const hasEnd = !!structured_data.endDate;

      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        structured.structured_data = await extractMissingDateRange({
          intent,
          structured_data,
          rawText: rawUserText,
          coreMessages,
        });
      }
    }

    const activeMode = (lastMessage?.metadata as any)?.intent || "other";
    const allowedIntentsForCurrentMode = ALLOWED_BY_CONTEXT[activeMode] || [];

    const intentMode =
      Object.entries(ALLOWED_BY_CONTEXT).find(([, intents]) =>
        intents.includes(intent)
      )?.[0] || "unknown";

    if (!allowedIntentsForCurrentMode.includes(intent)) {
      const correctMode =
        intentMode === "transaction"
          ? "a transaction action"
          : intentMode === "analytics"
            ? "an analytics query"
            : "a different type of command";

      return streamTextResponse(
        `You're in "${activeMode}" mode but asked for ${correctMode}. Please switch to the ${intentMode} mode to continue.`
      );
    }

    /* ---------------- Missing fields ---------------- */
    const allIntents = getIntentMetadata();
    const intentMeta = allIntents[intent as keyof typeof allIntents] ?? {
      required: [],
      optional: [],
    };

    const missing = intentMeta.required.filter(
      (field) =>
        structured_data[field] === undefined || structured_data[field] === null
    );

    if (missing.length > 0) {
      logger.info("POST /api/chat - Missing required fields", {
        userUuid,
        intent,
        missing,
      });
      return streamJSONResponse({
        type: "missing_fields",
        fields: missing.map((field) => ({
          name: field,
          label: field[0].toUpperCase() + field.slice(1),
          type: FIELD_TYPES[field] ?? DEFAULT_FIELD_TYPE,
          required: true,
        })),
        categories,
        resumeState: { intent, context: { partialData: structured_data } },
      });
    }

    const selectedTool =
      intent && (intent as ToolName) in tools
        ? tools[intent as ToolName]
        : undefined;

    if (!selectedTool) {
      logger.error(
        "POST /api/chat - Tool not found for intent",
        undefined,
        { intent }
      );
      return streamTextResponse(
        `Sorry — I don't have a tool for intent "${intent}".`
      );
    }

    logger.info("POST /api/chat - Executing tool", {
      userUuid,
      intent,
    });


    return streamToolResponse({
      toolName: intent,
      tool: selectedTool,
      toolInput: { ...structured_data, userUuid },
    });
  } catch (err: any) {
    if (isApiExhaustionError(err)) {
      return streamTextResponse(SERVER_OVERLOADED_MESSAGE);
    }

    if (err?.message === "Unauthorized") {
      logger.info("POST /api/chat - Unauthorized request");
      return new Response(HTTP_ERRORS.unauthorized.message, {
        status: HTTP_ERRORS.unauthorized.status,
      });
    }

    logger.error(
      "POST /api/chat - Unexpected error",
      err as Error,
    );

    return new Response(HTTP_ERRORS.serverError.message, {
      status: HTTP_ERRORS.serverError.status,
    });
  }
}
