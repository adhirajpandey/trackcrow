import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!messages || messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  const coreMessages = convertToModelMessages(messages);

  const response = await streamText({
    model: google("gemini-2.5-flash"),
    messages: coreMessages,
  });

  return response.toTextStreamResponse();
}
