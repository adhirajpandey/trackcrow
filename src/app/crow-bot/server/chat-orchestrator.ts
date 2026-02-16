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
    logger.info('POST /api/chat - Request received');

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

    if (HELP_REGEX.test(rawText)) {
      return streamTextResponse(getTrackCrowHelp());
    }

    if (CROWBOT_HELP_REGEX.test(rawText)) {
      return streamTextResponse(getCrowBotHelp());
    }

    const userUuid = await getSessionUser();
    const categories = await getUserCategories(userUuid);

    const classification = await classifyIntent({ messages, categories });

    if (classification.schemaFailure) {
      return streamTextResponse(ERROR_MESSAGES.schemaFailure);
    }

    if (!classification.result) {
      return streamTextResponse(ERROR_MESSAGES.couldNotUnderstand);
    }

    const { intent, relevance, structured_data } = classification.result;

    if (isLowRelevance(relevance)) {
      return streamTextResponse(getLowRelevanceResponse());
    }

    const activeMode =
      (lastMessage?.metadata as { intent?: string } | undefined)?.intent ||
      'other';
    const modeCheck = checkModeMismatch({ activeMode, intent });
    if (modeCheck.mismatch) {
      return streamTextResponse(modeCheck.message || ERROR_MESSAGES.couldNotUnderstand);
    }

    const missing = getMissingFields({ intent, structuredData: structured_data });
    if (missing.length > 0) {
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
      return streamTextResponse(
        `Sorry — I don't have a tool for intent "${intent}".`
      );
    }

    return streamToolResponse({
      toolName: intent,
      tool: selectedTool,
      toolInput: { ...structured_data, userUuid },
    });
  } catch (err: unknown) {
    if (isApiExhaustionError(err)) {
      return streamTextResponse(SERVER_OVERLOADED_MESSAGE);
    }

    throw err;
  }
}
