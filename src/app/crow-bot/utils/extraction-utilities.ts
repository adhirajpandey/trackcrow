import { z } from "zod";
import { UIMessage, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { toolSchema } from "@/common/schemas";
import { MODEL, MAX_SCHEMA_RETRIES } from "@/app/crow-bot/config/server-config";

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
  for (let attempt = 1; attempt <= MAX_SCHEMA_RETRIES; attempt++) {
    try {
      return await generateObject({
        model: google(MODEL),
        schema: toolSchema,
        messages: [
          { role: "system", content: classifierPrompt.content },
          { role: "user", content: rawText },
          ...coreMessages,
        ],
      });
    } catch (err: any) {
      if (
        err?.message?.includes("AI_NoObjectGeneratedError") &&
        attempt === 1
      ) {
        console.warn("Schema mismatch, retrying…");
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
      console.warn(`[⚠️ Invalid Range] Swapping dates for ${intent}`);
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
  } catch (e) {
    console.warn("Failed inference", e);
  }

  return structured_data;
}
