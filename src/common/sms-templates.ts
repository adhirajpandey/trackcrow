export const SMS_SCHEMA_VERSION = 1;
// Bump whenever templates or sender headers change, including parser-only changes.
export const SMS_CONFIG_VERSION = "1";

export type SmsTemplate = {
  name: string;
  keywords: (string | RegExp)[];
  excludeKeywords?: string[];
  regex: RegExp;
  type: "UPI" | "CARD";
  recipientNameFrom: "none" | "recipientWithoutUpiId" | "recipient_name";
};

export const smsBanks: {
  id: string;
  name: string;
  senderHeaders: string[];
  templates: SmsTemplate[];
}[] = [
  {
    id: "KOTAK",
    name: "Kotak",
    senderHeaders: ["KOTAKB"],
    templates: [
      {
        name: "KOTAK_UPI",
        keywords: [/Sent\s+Rs\./i, /Kotak\s+Bank/i, /UPI\s+Ref/i],
        regex:
          /Sent\s+Rs\.(?<amount>[\d,.]+)\s+from\s+Kotak\s+Bank\s+A\/?C\s+\w+\s+to\s+(?<recipient>[^\r\n]+?)\s+on\s+\d{2}-\d{2}-\d{2}\.\s*UPI\s+Ref\s+(?<reference>\d+)/i,
        type: "UPI",
        recipientNameFrom: "recipientWithoutUpiId",
      },
      {
        name: "KOTAK_CARD",
        keywords: ["Kotak Debit Card", "spent via"],
        regex:
          /Rs\.(?<amount>[\d,.]+)\s+spent\s+via\s+Kotak\s+Debit\s+Card\s+(?<card_number>\w+)\s+at\s+(?<recipient>[^.]+)\s+on\s+\d{2}\/\d{2}\/\d{4}/i,
        type: "CARD",
        recipientNameFrom: "none",
      },
      {
        name: "KOTAK_CREDIT_CARD",
        keywords: ["Kotak Credit Card", "spent on", " at "],
        regex:
          /INR\s+(?<amount>[\d,.]+)\s+spent\s+on\s+Kotak\s+Credit\s+Card\s+(?<card_number>x\d+)\s+on\s+.+?\s+at\s+UPI-(?:K-)?(?<reference>\d+)-(?<recipient_name>[^.]+)\./i,
        type: "CARD",
        recipientNameFrom: "recipient_name",
      },
    ],
  },
  {
    id: "HDFC",
    name: "HDFC",
    senderHeaders: ["HDFCBK"],
    templates: [
      {
        name: "HDFC_UPI_FORMATTED",
        keywords: ["HDFC Bank", "From", "To", "\n"],
        regex:
          /Sent\s+Rs\.(?<amount>[\d,.]+)\s*\nFrom\s+HDFC\s+Bank\s+A\/C\s+[^\n]+\nTo\s+(?<recipient>[^\n]+)\nOn\s+\d{2}\/\d{2}\/\d{2}\nRef\s+(?<reference>\d+)/i,
        type: "UPI",
        recipientNameFrom: "none",
      },
      {
        name: "HDFC_UPI",
        keywords: ["HDFC Bank", "From", "To"],
        excludeKeywords: ["\n"],
        regex:
          /Sent\s+Rs\.(?<amount>[\d,.]+)\s+From\s+HDFC\s+Bank\s+A\/C\s+\w+\s+To\s+(?<recipient>[^O]+?)\s+On\s+\d{2}\/\d{2}\/\d{2}\s+Ref\s+(?<reference>\d+)/i,
        type: "UPI",
        recipientNameFrom: "none",
      },
    ],
  },
];
