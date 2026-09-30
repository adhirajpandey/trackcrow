import type { ParseStatus } from "@/generated/prisma-rewrite";

export type ImportSmsInput = {
  userUuid: string;
  message: string;
  timestamp?: Date;
  location?: string | null;
  sender?: string;
  idempotencyKey?: string;
  storeMessageBody?: boolean;
};

export type ImportSmsOutcome =
  | { status: "CREATED"; uuid: string }
  | { status: "IGNORED"; ruleUuid: string }
  | { status: "DUPLICATE"; previousStatus: ParseStatus; uuid: string | null };
