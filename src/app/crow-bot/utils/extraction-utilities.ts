import { z } from "zod";
import { UIMessage, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { MODEL, MAX_SCHEMA_RETRIES } from "@/app/crow-bot/config/server-config";
import { logger } from "@/lib/logger";
import { isSchemaGenerationError } from "@/app/crow-bot/utils/error-detection";

const relaxedClassifierSchema = z
  .object({
    intent: z.string().optional().default("other"),
    relevance: z.number().optional().default(0),
    structured_data: z.object({}).passthrough().optional().default({}),
    missing_fields: z.array(z.string()).optional().default([]),
  })
  .passthrough();

export function getRawTextFromUIMessage(msg?: UIMessage) {
  if (!msg) return "";
  return (
    msg.parts
      ?.filter((p: any) => p.type === "text" && p.text)
      .map((p: any) => p.text)
      .join("\n")
      .trim() || ""
  );
}

export async function extractFieldsForIntent(
  rawText: string,
  coreMessages: any[],
  classifierPrompt: any
) {
  const modelMessages =
    coreMessages.length > 0
      ? [{ role: "system", content: classifierPrompt.content }, ...coreMessages]
      : [
          { role: "system", content: classifierPrompt.content },
          { role: "user", content: rawText },
        ];

  for (let attempt = 1; attempt <= MAX_SCHEMA_RETRIES; attempt++) {
    try {
      logger.info("crow-bot/extraction - generateObject attempt", {
        attempt,
        maxRetries: MAX_SCHEMA_RETRIES,
        model: MODEL,
        rawTextLength: rawText.length,
      });

      return await generateObject({
        model: google(MODEL),
        schema: relaxedClassifierSchema,
        messages: modelMessages,
      });
    } catch (err: any) {
      logger.warn("crow-bot/extraction - generateObject failed", {
        attempt,
        maxRetries: MAX_SCHEMA_RETRIES,
        name: err?.name,
        code: err?.code,
        status: err?.status,
        message: err?.message || String(err),
      });

      if (attempt < MAX_SCHEMA_RETRIES && isSchemaGenerationError(err, [])) {
        logger.warn("crow-bot/extraction - schema mismatch, retrying", {
          attempt,
        });
        continue;
      }
      throw err;
    }
  }
}

export async function extractMissingDateRange({
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

  if (hasStart && hasEnd) {
    const start = new Date(structured_data.startDate);
    const end = new Date(structured_data.endDate);

    if (start > end) {
      logger.warn("crow-bot/extraction - invalid range, swapping boundaries", {
        intent,
        startDate: structured_data.startDate,
        endDate: structured_data.endDate,
      });
      [structured_data.startDate, structured_data.endDate] = [
        structured_data.endDate,
        structured_data.startDate,
      ];
    }

    return structured_data;
  }

  const missingField = hasStart ? "endDate" : "startDate";
  const knownField = hasStart ? "startDate" : "endDate";

  const inferencePrompt = `
You are a strict JSON generator.
Given ${knownField} = "${structured_data[knownField]}", infer ${missingField}.
Return ONLY JSON: { "${missingField}": "YYYY-MM-DDTHH:mm:ss.sssZ" }

User query: "${rawText}"
`;

  try {
    logger.info("crow-bot/extraction - inferring missing date boundary", {
      intent,
      missingField,
      knownField,
      knownValue: structured_data[knownField] || null,
    });

    const res = await generateObject({
      model: google(MODEL),
      schema: z.object({
        [missingField]: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      }),
      messages: [{ role: "system", content: inferencePrompt }, ...coreMessages],
    });

    const inferred = res.object?.[missingField];
    if (inferred) structured_data[missingField] = inferred;

    const s = structured_data.startDate
      ? new Date(structured_data.startDate)
      : null;
    const e = structured_data.endDate
      ? new Date(structured_data.endDate)
      : null;

    if (s && e && s > e) {
      [structured_data.startDate, structured_data.endDate] = [
        structured_data.endDate,
        structured_data.startDate,
      ];
    }

    logger.info("crow-bot/extraction - date inference complete", {
      intent,
      startDate: structured_data.startDate || null,
      endDate: structured_data.endDate || null,
    });
  } catch (e) {
    logger.warn("crow-bot/extraction - date inference failed", {
      intent,
      missingField,
      message: (e as any)?.message || String(e),
      name: (e as any)?.name,
      code: (e as any)?.code,
      status: (e as any)?.status,
    });
  }

  return structured_data;
}
