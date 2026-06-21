type RecipientDisplayInput = {
  recipientName?: string | null;
  recipientDisplayName?: string | null;
  recipientRaw: string;
  fallbackLabel?: string;
};

function titleCaseWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanupRawRecipient(value: string) {
  const trimmed = value.trim();
  const beforeAt = trimmed.split("@")[0] ?? trimmed;
  const cleaned = beforeAt
    .replace(/\.{2,}.*$/, "")
    .replace(/\b(?:W\/O|S\/O|C\/O|D\/O|WO|SO|CO|DO)\b.*$/i, "")
    .replace(/[._-]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return trimmed;
  }

  return titleCaseWords(cleaned);
}

function normalizeReadableName(value: string) {
  return titleCaseWords(
    value
      .replace(/\.{2,}.*$/, "")
      .replace(/\b(?:W\/O|S\/O|C\/O|D\/O|WO|SO|CO|DO)\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function isLikelyUpiHandle(value: string) {
  const trimmed = value.trim();
  return /^[a-z0-9._-]+@[a-z]{2,}$/i.test(trimmed);
}

function hasAlphabeticSignal(value: string) {
  return /[a-z]/i.test(value);
}

function isLowConfidenceName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.length <= 1) {
    return true;
  }

  if (/^(unknown|upi recipient|upi payee|upi merchant)$/i.test(trimmed)) {
    return true;
  }

  return false;
}

function formatHandleLikeValue(value: string) {
  const trimmed = value.trim();
  const handlePrefix = trimmed.split("@")[0] ?? trimmed;
  const cleaned = cleanupRawRecipient(trimmed);

  if (!hasAlphabeticSignal(handlePrefix) || !hasAlphabeticSignal(cleaned) || cleaned.length <= 1) {
    if (isLikelyUpiHandle(trimmed)) {
      return `UPI: ${trimmed}`;
    }

    return null;
  }

  return cleaned;
}

function formatKnownValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("@") || /[._-]/.test(trimmed) || /\d/.test(trimmed)) {
    return formatHandleLikeValue(trimmed);
  }

  return normalizeReadableName(trimmed);
}

export function formatRecipientDisplayLabel(input: RecipientDisplayInput) {
  const fallbackLabel = input.fallbackLabel ?? "Unknown recipient";
  const recipientName = input.recipientName?.trim();
  if (recipientName) {
    const normalizedName = normalizeReadableName(recipientName);
    return isLowConfidenceName(normalizedName) ? fallbackLabel : normalizedName;
  }

  const recipientDisplayName = input.recipientDisplayName?.trim();
  if (recipientDisplayName) {
    const formattedDisplayName = formatKnownValue(recipientDisplayName);
    if (formattedDisplayName && !isLowConfidenceName(formattedDisplayName)) {
      return formattedDisplayName;
    }
  }

  const formattedRawRecipient = formatKnownValue(input.recipientRaw);
  if (formattedRawRecipient && !isLowConfidenceName(formattedRawRecipient)) {
    return formattedRawRecipient;
  }

  return fallbackLabel;
}
