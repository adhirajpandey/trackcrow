/* ------------------- Model Config ------------------- */
export const MODEL = "gemini-2.5-flash";

export const MAX_SCHEMA_RETRIES = 2;

/* ------------------- Regex Patterns ----------------- */
export const DATE_REGEX_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const HELP_REGEX =
  /\b(what(\s+is|'?s)?\s*(track\s*crow|trackcrow)|tell\s+(me\s+)?(about|more\s+about)\s*(track\s*crow|trackcrow)|how\s+(does|do)\s*(track\s*crow|trackcrow)\s+(work|function)|track\s*crow\s+(guide|manual|overview|info|help|support)|explain\s*(track\s*crow|trackcrow)|track\s*crow\s+(commands?|features?|capabilities?|abilities?|options?|modes?)|show\s+(me\s+)?(how\s+track\s*crow|trackcrow)\s+(works?|helps?)|track\s*crow\s*(intro|introduction|tutorial|details?|usage)|^track\s*crow!?$)\b/i;

export const CROWBOT_HELP_REGEX =
  /\b((who|what)\s+(are|is)\s*(you|crow\s*bot|crowbot)|what\s+can\s+(you|crow\s*bot|crowbot)\s+do|tell\s+(me\s+)?(about|more\s+about)\s*(you|crow\s*bot|crowbot)|how\s+(do|can)\s+i\s+(use|talk\s+to|interact\s+with|work\s+with)\s*(you|crow\s*bot|crowbot)|how\s+does\s*(it|crow\s*bot|crowbot)\s+(work|function)|show\s+(me\s+)?(commands?|features?|capabilities?|abilities?|options?|skills?|tasks?)|list\s+(commands?|features?|capabilities?)|help(\s+(me|menu|options|please|crow\s*bot|crowbot))?|crow\s*bot\s+(guide|manual|overview|intro|tutorial|support|help|info|commands?|abilities?|capabilities?)|^crow\s*bot!?$|^crowbot!?$)/i;

/* -------------------- Intent Config ------------------ */
export const ALLOWED_BY_CONTEXT: Record<string, string[]> = {
  transaction: ["recordExpense"],
  analytics: [
    "totalSpend",
    "topExpense",
    "expenseComparison",
    "transactionSearch",
    "dashboardSummary",
  ],
};

export const DATE_RANGE_INTENTS = [
  "totalSpend",
  "topExpense",
  "dashboardSummary",
  "expenseComparison",
  "transactionSearch",
] as const;

export const DEFAULT_INTENT = "other";
export const RELEVANCE_THRESHOLD = 2;

/* -------------------- Error Keywords ----------------- */
export const SCHEMA_FAILURE_KEYWORDS = [
  "AI_NoObjectGeneratedError",
  "AI_TypeValidationError",
  "ZodError",
  "invalid_format",
  "schema",
  "startDate must be in ISO 8601 format",
  "endDate must be in ISO 8601 format",
  "The model is overloaded. Please try again later",
];

/* -------------------- Error Messages ------------------ */
export const ERROR_MESSAGES = {
  schemaFailure: "Ah snap, something went wrong. Please try again later.",
  couldNotUnderstand: "Oops, I couldn't understand your request.",
};

export const MODE_MISMATCH_MESSAGE = (
  current: string,
  correctType: string,
  targetMode: string
) =>
  `You're in "${current}" mode but asked for ${correctType}. Please switch to the ${targetMode} mode to continue.`;

/* ---------------- System Logging Prefixes ------------- */
export const LOG_PREFIX = {
  invalidRange: "[⚠️ Invalid Range]",
  inferred: "[🧩 Auto-Inferred]",
  corrected: "[⚠️ Auto-Correction]",
};

/* ----------------------- Resume Keys ------------------ */
export const RESUME_KEYS = {
  flag: "__resume",
  intentMetaKey: "resumeIntent",
  stateMetaKey: "resumeState",
};

/* -------------------- Field Type Mapping --------------- */
export const FIELD_TYPES: Record<string, string> = {
  amount: "number",
  timestamp: "datetime-local",
};
export const DEFAULT_FIELD_TYPE = "text";

/* -------------------- Random Responses ---------------- */
export const EXPENSE_IRRELEVANT_RESPONSES = [
  "Hmm, that doesn’t seem like an expense or analytics request.",
  "I couldn’t recognize this as an expense-related message.",
  "This doesn’t look like a valid expense or spending query.",
  "That doesn’t appear to be an expense or analytics command.",
];

/* --------------------- HTTP Error Config -------------- */
export const HTTP_ERRORS = {
  unauthorized: { message: "Unauthorized", status: 401 },
  serverError: { message: "Internal Server Error", status: 500 },
};

/* ---------------------- Tool Output ------------------- */
export const TOOL_FAILURE_MESSAGE = (tool: string, err: string) =>
  `Tool "${tool}" failed: ${err}`;
