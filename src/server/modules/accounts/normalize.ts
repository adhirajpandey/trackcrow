export function cleanAccountName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeAccountName(name: string) {
  return cleanAccountName(name).toLowerCase();
}
