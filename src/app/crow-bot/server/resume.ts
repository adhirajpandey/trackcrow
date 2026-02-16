import { UIMessage } from 'ai';

export type ResumeState = {
  intent?: string;
  context?: { partialData?: Record<string, unknown> };
};

export type MessageWithMetadata = UIMessage & {
  metadata?: {
    intent?: string;
    hidden?: boolean;
    resumeIntent?: boolean;
    resumeState?: ResumeState;
  };
};

export function isResumeMessage(messages: UIMessage[]): boolean {
  const lastMessage = messages.at(-1);
  if (!lastMessage) return false;

  return (
    (lastMessage.metadata as { resumeIntent?: boolean } | undefined)
      ?.resumeIntent === true ||
    lastMessage.parts?.some(
      (p) =>
        p.type === 'text' &&
        typeof p.text === 'string' &&
        p.text.includes('"__resume":true')
    ) === true
  );
}

export function parseResumePayload(message?: UIMessage): {
  resumeState: ResumeState;
  mergedData: Record<string, unknown>;
} {
  const msg = message as MessageWithMetadata | undefined;
  const textPart = msg?.parts?.find(
    (p): p is { type: 'text'; text: string } => p.type === 'text'
  );

  const resumeText = textPart?.text ?? '{}';
  let parsed: Record<string, unknown> = {};

  try {
    parsed = JSON.parse(resumeText);
  } catch {
    parsed = {};
  }

  const parsedResumeState =
    parsed.resumeState && typeof parsed.resumeState === 'object'
      ? (parsed.resumeState as ResumeState)
      : undefined;

  const resumeState: ResumeState =
    msg?.metadata?.resumeState || parsedResumeState || {};

  const mergedData = {
    ...(resumeState.context?.partialData || {}),
    ...parsed,
  };

  return { resumeState, mergedData };
}
