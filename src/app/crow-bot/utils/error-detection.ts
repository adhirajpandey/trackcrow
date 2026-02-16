export function isApiExhaustionError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();

  return (
    err?.status === 429 ||
    err?.code === "insufficient_quota" ||
    err?.code === "rate_limit_exceeded" ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("exceeded") ||
    msg.includes("overloaded") ||
    msg.includes("capacity")
  );
}

export function isSchemaGenerationError(
  err: unknown,
  schemaFailureKeywords: string[]
): boolean {
  const msg = String((err as any)?.message || err || "");
  const name = String((err as any)?.name || "");

  if (
    name.includes("NoObjectGeneratedError") ||
    name.includes("TypeValidationError")
  ) {
    return true;
  }

  return schemaFailureKeywords.some((keyword) => msg.includes(keyword));
}
