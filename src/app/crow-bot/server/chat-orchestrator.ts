import { UIMessage } from 'ai';
import { getSessionUser, getUserCategories } from '@/common/server';
import { tools } from '@/app/crow-bot/tools';
import {
  getCrowBotHelp,
  getTrackCrowHelp,
} from '@/app/crow-bot/utils/help-responses';
import {
  streamJSONResponse,
  streamTextResponse,
  streamToolResponse,
} from '@/app/crow-bot/utils/stream-utilities';
import {
  CROWBOT_HELP_REGEX,
  ERROR_MESSAGES,
  HELP_REGEX,
  SERVER_OVERLOADED_MESSAGE,
} from '@/app/crow-bot/config/server-config';
import { isApiExhaustionError } from '@/app/crow-bot/utils/error-detection';
import { logger } from '@/lib/logger';
import { classifyIntent } from '@/app/crow-bot/server/classifier';
import {
  buildMissingFieldsPayload,
  checkModeMismatch,
  getLowRelevanceResponse,
  getMissingFields,
  isLowRelevance,
} from '@/app/crow-bot/server/intent-policy';
import {
  isResumeMessage,
  parseResumePayload,
} from '@/app/crow-bot/server/resume';

type ToolName = keyof typeof tools;

function hasAssistantToolOutput(messages: UIMessage[]): boolean {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  return (
    lastAssistant?.parts?.some(
      (p) =>
        p.type?.startsWith('tool-') &&
        (p as { state?: string }).state === 'output-available'
    ) === true
  );
}

export async function handleChatRequest(messages: UIMessage[]) {
  try {
    logger.info('POST /api/chat - Request received', {
      messageCount: messages.length,
    });

    const lastMessage = messages.at(-1);

    const isResume = isResumeMessage(messages);
    const lastHadToolOutput = hasAssistantToolOutput(messages);

    if (isResume && !lastHadToolOutput) {
      logger.info('POST /api/chat - Resuming previous intent');
      const { resumeState, mergedData } = parseResumePayload(lastMessage);
      const intent = resumeState.intent as ToolName | undefined;

      if (!intent) {
        return streamTextResponse(
          "Sorry — I couldn't identify what you meant. Try again?"
        );
      }

      const selectedTool = tools[intent];
      if (!selectedTool) {
        return streamTextResponse(
          `Sorry — I don't have a tool for intent "${intent}".`
        );
      }

      const userUuid = await getSessionUser();
      return streamToolResponse({
        toolName: intent,
        tool: selectedTool,
        toolInput: { ...mergedData, userUuid },
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const rawText =
      lastUserMessage?.parts
        ?.filter(
          (p): p is { type: 'text'; text: string } =>
            p.type === 'text' && typeof p.text === 'string'
        )
        .map((p) => p.text)
        .join('\n')
        .trim() || '';

    logger.info('POST /api/chat - User message parsed', {
      rawTextLength: rawText.length,
      rawTextPreview: rawText.slice(0, 160),
      isResume,
      lastHadToolOutput,
    });

    if (HELP_REGEX.test(rawText)) {
      logger.info('POST /api/chat - Returning trackcrow help response');
      return streamTextResponse(getTrackCrowHelp());
    }

    if (CROWBOT_HELP_REGEX.test(rawText)) {
      logger.info('POST /api/chat - Returning crowbot help response');
      return streamTextResponse(getCrowBotHelp());
    }

    const userUuid = await getSessionUser();
    const categories = await getUserCategories(userUuid);
    logger.info('POST /api/chat - Loaded user context', {
      userUuid,
      categoryCount: categories.length,
    });

    const classification = await classifyIntent({ messages, categories });

    if (classification.schemaFailure) {
      logger.warn('POST /api/chat - Schema failure fallback returned', {
        userUuid,
        rawTextPreview: rawText.slice(0, 160),
      });
      return streamTextResponse(ERROR_MESSAGES.schemaFailure);
    }

    if (!classification.result) {
      logger.warn('POST /api/chat - Could not understand fallback returned', {
        userUuid,
        rawTextPreview: rawText.slice(0, 160),
      });
      return streamTextResponse(ERROR_MESSAGES.couldNotUnderstand);
    }

    const { intent, relevance, structured_data } = classification.result;
    logger.info('POST /api/chat - Classification accepted', {
      userUuid,
      intent,
      relevance,
      structuredKeys: Object.keys(structured_data || {}),
    });

    if (isLowRelevance(relevance)) {
      logger.info('POST /api/chat - Low relevance response returned', {
        userUuid,
        intent,
        relevance,
      });
      return streamTextResponse(getLowRelevanceResponse());
    }

    const activeMode =
      (lastMessage?.metadata as { intent?: string } | undefined)?.intent ||
      'other';
    const modeCheck = checkModeMismatch({ activeMode, intent });
    if (modeCheck.mismatch) {
      logger.warn('POST /api/chat - Mode mismatch detected', {
        userUuid,
        activeMode,
        intent,
      });
      return streamTextResponse(modeCheck.message || ERROR_MESSAGES.couldNotUnderstand);
    }

    const missing = getMissingFields({ intent, structuredData: structured_data });
    if (missing.length > 0) {
      logger.info('POST /api/chat - Missing fields requested', {
        userUuid,
        intent,
        missing,
      });
      return streamJSONResponse(
        buildMissingFieldsPayload({
          missing,
          categories,
          intent,
          structuredData: structured_data,
        })
      );
    }

    const selectedTool = tools[intent as ToolName];
    if (!selectedTool) {
      logger.warn('POST /api/chat - Intent has no mapped tool', {
        userUuid,
        intent,
      });
      return streamTextResponse(
        `Sorry — I don't have a tool for intent "${intent}".`
      );
    }

    logger.info('POST /api/chat - Dispatching tool execution', {
      userUuid,
      intent,
    });
    return streamToolResponse({
      toolName: intent,
      tool: selectedTool,
      toolInput: { ...structured_data, userUuid },
    });
  } catch (err: unknown) {
    if (isApiExhaustionError(err)) {
      logger.warn('POST /api/chat - API exhaustion fallback returned', {
        message: (err as any)?.message || String(err),
        code: (err as any)?.code,
        status: (err as any)?.status,
      });
      return streamTextResponse(SERVER_OVERLOADED_MESSAGE);
    }

    logger.error('POST /api/chat - Unhandled orchestrator error', err as Error);
    throw err;
  }
}
