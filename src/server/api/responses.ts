import { NextResponse } from "next/server";

import type { ServiceFailure, ServiceResult } from "@/server/shared/result";

export function jsonOk<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status: number, extra?: object) {
  return NextResponse.json({ message, ...extra }, { status });
}

export function fromServiceError(result: ServiceFailure) {
  switch (result.error) {
    case "UNAUTHORIZED":
      return jsonError("Unauthorized", 401);
    case "VALIDATION_ERROR":
      return jsonError("Invalid request", 400, result.details ? { issues: result.details } : undefined);
    case "NOT_FOUND":
      return jsonError("Not found", 404);
    case "CONFLICT":
      return jsonError("Conflict", 409);
    case "UNPROCESSABLE":
      return jsonError("Unprocessable entity", 422, result.details ? { details: result.details } : undefined);
    default:
      return jsonError("Internal Server Error", 500);
  }
}

export function unwrapOrResponse<T>(result: ServiceResult<T>) {
  if (result.ok) {
    return result.data;
  }

  return fromServiceError(result);
}
