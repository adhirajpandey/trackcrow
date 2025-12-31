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
