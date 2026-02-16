import { convertToModelMessages, UIMessage } from 'ai';
import { buildClassifierPrompt } from '@/app/crow-bot/prompts';
import {
  extractFieldsForIntent,
  extractMissingDateRange,
  getRawTextFromUIMessage,
} from '@/app/crow-bot/utils/extraction-utilities';
import {
  DATE_RANGE_INTENTS,
  SCHEMA_FAILURE_KEYWORDS,
} from '@/app/crow-bot/config/server-config';
import {
  isApiExhaustionError,
  isSchemaGenerationError,
} from '@/app/crow-bot/utils/error-detection';
import { logger } from '@/lib/logger';
import { getIntentMetadata } from '@/app/crow-bot/prompts/sections/intent-metadata';

export type ClassifiedIntent = {
  relevance: number;
  intent: string;
  structured_data: Record<string, any>;
};

function summarizeError(err: unknown) {
  const e = err as any;
  return {
    name: e?.name,
    message: e?.message || String(err),
    code: e?.code,
    status: e?.status,
  };
}

export async function classifyIntent(input: {
  messages: UIMessage[];
  categories: { name: string; subcategories: string[] }[];
}): Promise<{ result?: ClassifiedIntent; schemaFailure: boolean }> {
  const { messages, categories } = input;
  const coreMessages = await convertToModelMessages(messages);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const rawUserText = getRawTextFromUIMessage(lastUserMessage);

  logger.info('crow-bot/classifier - Starting intent classification', {
    messageCount: messages.length,
    categoryCount: categories.length,
    rawTextLength: rawUserText.length,
    rawTextPreview: rawUserText.slice(0, 160),
  });

  let structuredResObj;
  try {
    structuredResObj = await extractFieldsForIntent(
      rawUserText,
      coreMessages,
      buildClassifierPrompt(categories)
    );
  } catch (err: unknown) {
    const errorSummary = summarizeError(err);
    logger.warn('crow-bot/classifier - Extraction failed', errorSummary);

    if (isApiExhaustionError(err)) {
      logger.warn('crow-bot/classifier - API exhaustion detected', errorSummary);
      throw err;
    }

    if (isSchemaGenerationError(err, SCHEMA_FAILURE_KEYWORDS)) {
      logger.warn('crow-bot/classifier - Schema failure detected', errorSummary);
      return { schemaFailure: true };
    }

    logger.error(
      'crow-bot/classifier - Non-schema extraction error',
      err as Error,
      errorSummary
    );
    throw err;
  }

  const structured = structuredResObj?.object;
  if (!structured) {
    logger.warn('crow-bot/classifier - Empty structured response');
    return { schemaFailure: false };
  }

  const allowedIntents = new Set([...Object.keys(getIntentMetadata()), 'other']);
  const rawIntent = typeof structured.intent === 'string' ? structured.intent : 'other';
  const normalizedIntent = allowedIntents.has(rawIntent) ? rawIntent : 'other';

  const rawRelevance = Number(structured.relevance);
  const normalizedRelevance = Number.isFinite(rawRelevance)
    ? Math.min(5, Math.max(0, rawRelevance))
    : normalizedIntent === 'other'
      ? 0
      : 3;

  const normalized: ClassifiedIntent = {
    relevance: normalizedRelevance,
    intent: normalizedIntent,
    structured_data:
      structured.structured_data && typeof structured.structured_data === 'object'
        ? structured.structured_data
        : {},
  };

  logger.info('crow-bot/classifier - Classification result', {
    intent: normalized.intent,
    relevance: normalized.relevance,
    structuredKeys: Object.keys(normalized.structured_data || {}),
  });

  if (DATE_RANGE_INTENTS.includes(normalized.intent as any)) {
    const hasStart = !!normalized.structured_data.startDate;
    const hasEnd = !!normalized.structured_data.endDate;

    if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
      logger.info('crow-bot/classifier - Inferring missing date boundary', {
        intent: normalized.intent,
        hasStart,
        hasEnd,
      });
      normalized.structured_data = await extractMissingDateRange({
        intent: normalized.intent,
        structured_data: normalized.structured_data,
        rawText: rawUserText,
        coreMessages,
      });

      logger.info('crow-bot/classifier - Date boundary inference complete', {
        intent: normalized.intent,
        startDate: normalized.structured_data.startDate || null,
        endDate: normalized.structured_data.endDate || null,
      });
    }
  }

  return { result: normalized, schemaFailure: false };
}
