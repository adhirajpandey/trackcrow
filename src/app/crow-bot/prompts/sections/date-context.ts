export function getDateContext() {
  const now = new Date();

  const currentTimestamp = now.toISOString();

  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );

  const endOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );

  return { now, currentTimestamp, startOfMonth, endOfMonth };
}
