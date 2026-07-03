import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogPrimitive = string | number | boolean | null;
type LogValue = LogPrimitive | LogValue[] | { [key: string]: LogValue | undefined };

type LogMetadata = Record<string, LogValue | undefined>;

type LogEntry = LogMetadata & {
  event: string;
  message?: string;
  userId?: string;
  error?: LogValue;
};

type RequestContext = {
  requestId: string;
  method?: string;
  path?: string;
};

const requestContextStore = new AsyncLocalStorage<RequestContext>();

const isDevelopment = process.env.NODE_ENV === "development";
const isDebugEnabled = process.env.LOG_LEVEL === "debug" || isDevelopment;

const redactedKeys = new Set([
  "accountnumber",
  "authorization",
  "body",
  "cardnumber",
  "cookie",
  "cookies",
  "password",
  "rawtext",
  "reference",
  "session",
  "token",
]);

const redactedValue = "[REDACTED]";

function normalizeKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    name: error.name,
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
  };
}

function redactValue(key: string | undefined, value: unknown): LogValue | undefined {
  if (key && redactedKeys.has(normalizeKey(key))) {
    return redactedValue;
  }

  if (value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(undefined, item) ?? null);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return redactValue(key, serializeError(value));
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (isPlainObject(value)) {
    const redactedObject: Record<string, LogValue | undefined> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      redactedObject[childKey] = redactValue(childKey, childValue);
    }
    return redactedObject;
  }

  return String(value);
}

function coerceLegacyEntry(
  level: LogLevel,
  entryOrMessage: LogEntry | string,
  maybeErrorOrData?: unknown,
  maybeData?: LogMetadata
) {
  if (typeof entryOrMessage !== "string") {
    const entry = { ...entryOrMessage };

    if (maybeData) {
      Object.assign(entry, maybeData);
    }

    if (level === "error" && maybeErrorOrData !== undefined) {
      entry.error = serializeError(maybeErrorOrData) as LogValue;
    }

    return entry satisfies LogEntry;
  }

  if (level === "error") {
    const error = maybeErrorOrData;
    const metadata = maybeData ?? {};

    return {
      event: "legacy.error",
      message: entryOrMessage,
      ...metadata,
      ...(error ? { error: serializeError(error) as LogValue } : {}),
    } satisfies LogEntry;
  }

  return {
    event: `legacy.${level}`,
    message: entryOrMessage,
    ...(isPlainObject(maybeErrorOrData) ? (maybeErrorOrData as LogMetadata) : {}),
  } satisfies LogEntry;
}

function writeLog(level: LogLevel, entry: LogEntry) {
  if (level === "debug" && !isDebugEnabled) {
    return;
  }

  const requestContext = requestContextStore.getStore();
  const payload = redactValue(undefined, {
    timestamp: new Date().toISOString(),
    level,
    event: entry.event,
    message: entry.message,
    requestId: requestContext?.requestId,
    method: requestContext?.method,
    path: requestContext?.path,
    ...entry,
  });

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  if (level === "info") {
    console.info(serialized);
    return;
  }

  console.log(serialized);
}

export function withRequestContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStore.run(context, fn);
}

export function getRequestContext() {
  return requestContextStore.getStore();
}

export function createRequestContext(input?: Partial<RequestContext>): RequestContext {
  return {
    requestId: input?.requestId ?? randomUUID(),
    method: input?.method,
    path: input?.path,
  };
}

export const logger = {
  debug(entryOrMessage: LogEntry | string, data?: LogMetadata) {
    writeLog("debug", coerceLegacyEntry("debug", entryOrMessage, data));
  },

  info(entryOrMessage: LogEntry | string, data?: LogMetadata) {
    writeLog("info", coerceLegacyEntry("info", entryOrMessage, data));
  },

  warn(entryOrMessage: LogEntry | string, data?: LogMetadata) {
    writeLog("warn", coerceLegacyEntry("warn", entryOrMessage, data));
  },

  error(entryOrMessage: LogEntry | string, error?: unknown, data?: LogMetadata) {
    writeLog("error", coerceLegacyEntry("error", entryOrMessage, error, data));
  },
};
