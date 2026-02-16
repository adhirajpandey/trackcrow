import {
  ALLOWED_BY_CONTEXT,
  DEFAULT_FIELD_TYPE,
  EXPENSE_IRRELEVANT_RESPONSES,
  FIELD_TYPES,
  RELEVANCE_THRESHOLD,
} from '@/app/crow-bot/config/server-config';
import { getIntentMetadata } from '@/app/crow-bot/prompts/sections/intent-metadata';

export function getLowRelevanceResponse(): string {
  return EXPENSE_IRRELEVANT_RESPONSES[
    Math.floor(Math.random() * EXPENSE_IRRELEVANT_RESPONSES.length)
  ];
}

export function isLowRelevance(relevance: number): boolean {
  return relevance <= RELEVANCE_THRESHOLD;
}

export function checkModeMismatch(input: {
  activeMode: string;
  intent: string;
}): { mismatch: boolean; message?: string } {
  const { activeMode, intent } = input;
  const allowedIntentsForCurrentMode = ALLOWED_BY_CONTEXT[activeMode] || [];

  const intentMode =
    Object.entries(ALLOWED_BY_CONTEXT).find(([, intents]) =>
      intents.includes(intent)
    )?.[0] || 'unknown';

  if (allowedIntentsForCurrentMode.includes(intent)) {
    return { mismatch: false };
  }

  const correctMode =
    intentMode === 'transaction'
      ? 'a transaction action'
      : intentMode === 'analytics'
        ? 'an analytics query'
        : 'a different type of command';

  return {
    mismatch: true,
    message: `You're in "${activeMode}" mode but asked for ${correctMode}. Please switch to the ${intentMode} mode to continue.`,
  };
}

export function getMissingFields(input: {
  intent: string;
  structuredData: Record<string, unknown>;
}) {
  const allIntents = getIntentMetadata();
  const intentMeta = allIntents[input.intent as keyof typeof allIntents] ?? {
    required: [],
    optional: [],
  };

  const missing = intentMeta.required.filter(
    (field) =>
      input.structuredData[field] === undefined ||
      input.structuredData[field] === null
  );

  return missing;
}

export function buildMissingFieldsPayload(input: {
  missing: string[];
  categories: { name: string; subcategories: string[] }[];
  intent: string;
  structuredData: Record<string, unknown>;
}) {
  return {
    type: 'missing_fields',
    fields: input.missing.map((field) => ({
      name: field,
      label: field[0].toUpperCase() + field.slice(1),
      type: FIELD_TYPES[field] ?? DEFAULT_FIELD_TYPE,
      required: true,
    })),
    categories: input.categories,
    resumeState: {
      intent: input.intent,
      context: { partialData: input.structuredData },
    },
  };
}
