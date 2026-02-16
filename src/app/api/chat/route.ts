import { UIMessage } from 'ai';
import { handleChatRequest } from '@/app/crow-bot/server/chat-orchestrator';
import { HTTP_ERRORS } from '@/app/crow-bot/config/server-config';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    return await handleChatRequest(messages);
  } catch (err: any) {
    if (err?.message === 'Unauthorized') {
      logger.info('POST /api/chat - Unauthorized request');
      return new Response(HTTP_ERRORS.unauthorized.message, {
        status: HTTP_ERRORS.unauthorized.status,
      });
    }

    logger.error('POST /api/chat - Unexpected error', err as Error);
    return new Response(HTTP_ERRORS.serverError.message, {
      status: HTTP_ERRORS.serverError.status,
    });
  }
}
