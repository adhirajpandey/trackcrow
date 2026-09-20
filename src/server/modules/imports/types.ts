export type ImportSmsInput = {
  userUuid: string;
  message: string;
  location?: string | null;
};

export type ImportSmsOutcome =
  | { ignored: false; uuid: string }
  | { ignored: true; ruleUuid: string };
