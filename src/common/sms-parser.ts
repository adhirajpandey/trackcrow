export type ParsedTransactionDetails = {
  amount: number | null;
  recipient: string | null;
  recipient_name?: string | null;
  type: "UPI" | "CARD" | "CASH" | "NETBANKING" | "OTHER";
  reference?: string | null;
  account?: string | null;
};

type SmsParser = {
  name: string;
  test: (message: string) => boolean;
  regex: RegExp;
  mapper: (match: RegExpMatchArray) => ParsedTransactionDetails;
};

// Configuration for all supported SMS templates
const smsParsers: SmsParser[] = [
  // Kotak UPI: "Sent Rs.90.00 from Kotak Bank AC X5213 to paytmqr68kufv@ptys on 16-09-25.UPI Ref 525982708197."
  {
    name: 'KOTAK_UPI',
    test: (message) => message.includes('Kotak Bank') && message.includes('UPI Ref'),
    regex: /Sent\s+Rs\.(?<amount>[\d,.]+)\s+from\s+Kotak\s+Bank\s+AC\s+\w+\s+to\s+(?<recipient>[^\s]+@[^\s]+)\s+on\s+\d{2}-\d{2}-\d{2}\.UPI\s+Ref\s+(?<reference>\d+)/i,
    mapper: (match) => {
      const groups = match.groups ?? {};
      return {
        amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, '')) : null,
        recipient: groups.recipient ?? null,
        reference: groups.reference ?? null,
        type: 'UPI',
        account: 'KOTAK',
      };
    },
  },
  // Kotak Debit Card: "Rs.240.46 spent via Kotak Debit Card XX3971 at CONNAUGHT PLAZA GURGAON on 13/09/2025."
  {
    name: 'KOTAK_CARD',
    test: (message) => message.includes('Kotak Debit Card') && message.includes('spent via'),
    regex: /Rs\.(?<amount>[\d,.]+)\s+spent\s+via\s+Kotak\s+Debit\s+Card\s+(?<card_number>\w+)\s+at\s+(?<recipient>[^.]+)\s+on\s+\d{2}\/\d{2}\/\d{4}/i,
    mapper: (match) => {
      const groups = match.groups ?? {};
      return {
        amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, '')) : null,
        recipient: groups.recipient?.trim() ?? null,
        type: 'CARD',
        account: 'KOTAK',
      };
    },
  },
  // Kotak Credit Card: "INR 200 spent on Kotak Credit Card x6387 on 28-FEB-2026 at UPI-600117529647-HAMAN. Avl limit INR 29668.72 ..."
  {
    name: 'KOTAK_CREDIT_CARD',
    test: (message) => message.includes('Kotak Credit Card') && message.includes('spent on') && message.includes(' at '),
    regex: /INR\s+(?<amount>[\d,.]+)\s+spent\s+on\s+Kotak\s+Credit\s+Card\s+(?<card_number>x\d+)\s+on\s+.+?\s+at\s+UPI-(?:K-)?(?<reference>\d+)-(?<recipient_name>[^.]+)\./i,
    mapper: (match) => {
      const groups = match.groups ?? {};
      return {
        amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, '')) : null,
        recipient: groups.recipient_name?.trim() ?? null,
        recipient_name: groups.recipient_name?.trim() ?? null,
        reference: groups.reference ?? null,
        type: 'CARD',
        account: 'KOTAK',
      };
    },
  },

  // HDFC UPI: Format with line breaks
  {
    name: 'HDFC_UPI_FORMATTED',
    test: (message) => message.includes('HDFC Bank') && message.includes('From') && message.includes('To') && message.includes('\n'),
    regex: /Sent\s+Rs\.(?<amount>[\d,.]+)\s*\nFrom\s+HDFC\s+Bank\s+A\/C\s+[^\n]+\nTo\s+(?<recipient>[^\n]+)\nOn\s+\d{2}\/\d{2}\/\d{2}\nRef\s+(?<reference>\d+)/i,
    mapper: (match) => {
      const groups = match.groups ?? {};
      return {
        amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, '')) : null,
        recipient: groups.recipient?.trim() ?? null,
        reference: groups.reference ?? null,
        type: 'UPI',
        account: 'HDFC',
      };
    },
  },
  // HDFC UPI: Single-line format (original)
  {
    name: 'HDFC_UPI',
    test: (message) => message.includes('HDFC Bank') && message.includes('From') && message.includes('To') && !message.includes('\n'),
    regex: /Sent\s+Rs\.(?<amount>[\d,.]+)\s+From\s+HDFC\s+Bank\s+A\/C\s+\w+\s+To\s+(?<recipient>[^O]+?)\s+On\s+\d{2}\/\d{2}\/\d{2}\s+Ref\s+(?<reference>\d+)/i,
    mapper: (match) => {
      const groups = match.groups ?? {};
      return {
        amount: groups.amount ? parseFloat(groups.amount.replace(/,/g, '')) : null,
        recipient: groups.recipient?.trim() ?? null,
        reference: groups.reference ?? null,
        type: 'UPI',
        account: 'HDFC',
      };
    },
  },
];

/**
 * Parses a transaction message by trying all available parsers.
 * Returns the details of the first successful parse, or null if no parser matches.
 */
export function parseTransactionMessage(message: string): ParsedTransactionDetails | null {
  for (const parser of smsParsers) {
    if (parser.test(message)) {
      const match = message.match(parser.regex);
      if (match && match.groups) {
        try {
          const result = parser.mapper(match);
          console.log(`Successfully parsed message with parser "${parser.name}":`, {
            amount: result.amount,
            recipient: result.recipient,
            type: result.type,
            account: result.account
          });
          return result;
        } catch (error) {
          console.error(`Error mapping with parser "${parser.name}":`, error);
          // Continue to the next parser
        } 
      }
    }
  }
  
  console.log("No parser matched the message:", message);
  return null;
}
