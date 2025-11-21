import { createUIMessageStreamResponse, createUIMessageStream } from "ai";

import { TOOL_FAILURE_MESSAGE } from "@/app/crow-bot/config/server-config";

export function streamTextResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        const id = crypto.randomUUID();
        writer.write({ type: "start", messageId: id });
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
        writer.write({ type: "finish" });
      },
    }),
  });
}

export function streamJSONResponse(payload: any) {
  return streamTextResponse(JSON.stringify(payload));
}

export function streamToolResponse({
  toolName,
  tool,
  toolInput,
  executeArgs,
}: {
  toolName: string;
  tool: any;
  toolInput: any;
  executeArgs?: any;
}) {
  const toolCallId = crypto.randomUUID();
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({ type: "start-step" });
        writer.write({ type: "tool-input-start", toolCallId, toolName });
        writer.write({
          type: "tool-input-available",
          toolCallId,
          toolName,
          input: toolInput,
        });

        try {
          const output = await tool.execute(executeArgs ?? toolInput);
          writer.write({ type: "tool-output-available", toolCallId, output });
        } catch (err: any) {
          writer.write({
            type: "text-delta",
            id: toolCallId,
            delta: TOOL_FAILURE_MESSAGE(toolName, err?.message || String(err)),
          });
        }

        writer.write({ type: "finish-step" });
        writer.write({ type: "finish" });
      },
    }),
  });
}
