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

export type ClassifiedIntent = {
  relevance: number;
  intent: string;
  structured_data: Record<string, any>;
};

export async function classifyIntent(input: {
  messages: UIMessage[];
  categories: { name: string; subcategories: string[] }[];
}): Promise<{ result?: ClassifiedIntent; schemaFailure: boolean }> {
  const { messages, categories } = input;
  const coreMessages = await convertToModelMessages(messages);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const rawUserText = getRawTextFromUIMessage(lastUserMessage);

  let structuredResObj;
  try {
    structuredResObj = await extractFieldsForIntent(
      rawUserText,
      coreMessages,
      buildClassifierPrompt(categories)
    );
  } catch (err: unknown) {
    const msg = String(err);
    if (SCHEMA_FAILURE_KEYWORDS.some((k) => msg.includes(k))) {
      return { schemaFailure: true };
    }
    throw err;
  }

  const structured = structuredResObj?.object;
  if (!structured) {
    return { schemaFailure: false };
  }

  const normalized: ClassifiedIntent = {
    relevance: structured.relevance,
    intent: structured.intent,
    structured_data: structured.structured_data || {},
  };

  if (DATE_RANGE_INTENTS.includes(normalized.intent as any)) {
    const hasStart = !!normalized.structured_data.startDate;
    const hasEnd = !!normalized.structured_data.endDate;

    if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
      normalized.structured_data = await extractMissingDateRange({
        intent: normalized.intent,
        structured_data: normalized.structured_data,
        rawText: rawUserText,
        coreMessages,
      });
    }
  }

  return { result: normalized, schemaFailure: false };
}
