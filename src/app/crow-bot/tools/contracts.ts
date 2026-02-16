export type ToolErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export type ToolSuccess<T> = {
  ok: true;
  data: T;
};

export type ToolFailure = {
  ok: false;
  code: ToolErrorCode;
  message: string;
  details?: unknown;
};

export type ToolResult<T> = ToolSuccess<T> | ToolFailure;

export function toolOk<T>(data: T): ToolSuccess<T> {
  return { ok: true, data };
}

export function toolFail(
  code: ToolErrorCode,
  message: string,
  details?: unknown
): ToolFailure {
  return { ok: false, code, message, details };
}

export function isToolResult(value: unknown): value is ToolResult<unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    'ok' in value &&
    typeof (value as { ok: unknown }).ok === 'boolean'
  );
}
