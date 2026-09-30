import { logger } from "@/lib/logger";
import {
  smsBanks,
  SMS_CONFIG_VERSION,
  type SmsTemplate,
} from "./sms-templates";

export type ParsedTransactionDetails = {
  amount: number | null;
  recipient: string | null;
  recipient_name?: string | null;
  type: "UPI" | "CARD" | "CASH" | "NETBANKING" | "OTHER";
  reference?: string | null;
  account?: string | null;
};

function mapTemplate(
  groups: Record<string, string>,
  template: SmsTemplate,
  account: string,
): ParsedTransactionDetails {
  const recipient = (groups.recipient ?? groups.recipient_name)?.trim() ?? null;
  const recipientName =
    template.recipientNameFrom === "recipient_name"
      ? (groups.recipient_name?.trim() ?? null)
      : template.recipientNameFrom === "recipientWithoutUpiId" &&
          !recipient?.includes("@")
        ? recipient
        : null;
  return {
    amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, "")) : null,
    recipient,
    ...(recipientName ? { recipient_name: recipientName } : {}),
    ...(groups.reference
      ? { reference: groups.reference }
      : template.type === "UPI"
        ? { reference: null }
        : {}),
    type: template.type,
    account,
  };
}

export type ParsedTransactionMatch = {
  parserName: string;
  configVersion: string;
  details: ParsedTransactionDetails;
};

/**
 * Parses a transaction message by trying all available parsers.
 * Returns the details of the first successful parse, or null if no parser matches.
 */
export function parseTransactionMessage(
  message: string,
): ParsedTransactionDetails | null {
  return matchTransactionMessage(message)?.details ?? null;
}

/** Like parseTransactionMessage, but also names the parser that matched. */
export function matchTransactionMessage(
  message: string,
): ParsedTransactionMatch | null {
  for (const bank of smsBanks) {
    for (const parser of bank.templates) {
      if (
        parser.keywords.every((keyword) =>
          typeof keyword === "string"
            ? message.includes(keyword)
            : keyword.test(message),
        ) &&
        !parser.excludeKeywords?.some((keyword) => message.includes(keyword))
      ) {
        const match = message.match(parser.regex);
        if (match && match.groups) {
          try {
            const result = mapTemplate(match.groups, parser, bank.id);
            logger.debug({
              event: "sms_parser.matched",
              parserName: parser.name,
              type: result.type,
              account: result.account,
              hasAmount: result.amount != null,
              hasRecipient: result.recipient != null,
            });
            return {
              parserName: parser.name,
              configVersion: SMS_CONFIG_VERSION,
              details: result,
            };
          } catch (error) {
            logger.warn({
              event: "sms_parser.mapping_failed",
              parserName: parser.name,
              message: "SMS parser mapper failed",
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue to the next parser
          }
        }
      }
    }
  }

  logger.debug({
    event: "sms_parser.no_match",
    message: "No SMS parser matched the message",
  });
  return null;
}
