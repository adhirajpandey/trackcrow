export type ServiceErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR";

export type ServiceSuccess<T> = { ok: true; data: T };
export type ServiceFailure<E extends ServiceErrorCode = ServiceErrorCode> = {
  ok: false;
  error: E;
  details?: unknown;
};

export type ServiceResult<T, E extends ServiceErrorCode = ServiceErrorCode> =
  | ServiceSuccess<T>
  | ServiceFailure<E>;

export function ok<T>(data: T): ServiceSuccess<T> {
  return { ok: true, data };
}

export function fail<E extends ServiceErrorCode>(
  error: E,
  details?: unknown
): ServiceFailure<E> {
  return { ok: false, error, details };
}
