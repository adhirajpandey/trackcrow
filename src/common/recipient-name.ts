const KEEP_UPPER = new Set(["UPI", "ATM", "IMPS", "NEFT", "RTGS", "EMI", "LIC", "SBI", "ICICI", "IRCTC", "NSE", "BSE"]);
const TITLE = new Map([["PVT", "Pvt"], ["LTD", "Ltd"], ["CO", "Co"], ["LLP", "LLP"]]);

function tidyWord(word: string) {
  if (/[^A-Z]/.test(word)) return word; // digits, symbols or mixed case: leave as the bank wrote it
  if (TITLE.has(word)) return TITLE.get(word)!;
  if (KEEP_UPPER.has(word) || word.length <= 2 || !/[AEIOUY]/.test(word)) return word;
  return word[0] + word.slice(1).toLowerCase();
}

/**
 * Display form of a bank-supplied recipient name. Names typed entirely in capitals
 * ("BRAJESH KUMAR RAJPOO") read as "Brajesh Kumar Rajpoo"; short codes such as HDFC
 * or NCL stay in capitals. Names that already use lowercase are only trimmed.
 * The stored name is never changed.
 */
export function tidyRecipientName(name: string) {
  const collapsed = name.trim().replace(/\s+/g, " ");
  if (!collapsed || /[a-z]/.test(collapsed)) return collapsed;
  return collapsed.split(" ").map(tidyWord).join(" ");
}
