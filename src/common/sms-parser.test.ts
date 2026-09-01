import { parseTransactionMessage } from "./sms-parser";

describe("parseTransactionMessage", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses Kotak UPI messages with amount, recipient, reference, and account", () => {
    const parsed = parseTransactionMessage(
      "Sent Rs.90.00 from Kotak Bank AC X5213 to paytmqr68kufv@ptys on 16-09-25.UPI Ref 525982708197."
    );

    expect(parsed).toEqual({
      amount: 90,
      recipient: "paytmqr68kufv@ptys",
      reference: "525982708197",
      type: "UPI",
      account: "KOTAK",
    });
  });

  it("parses new Kotak UPI messages that contain a recipient name", () => {
    const parsed = parseTransactionMessage(
      "Sent Rs.80.00 from Kotak Bank A/c X5213 to SAHIL YADAV on 31-08-26. UPI Ref 214558404246. Not done by you? Tap https://kotak.bank.in/KBANKT/Fraud"
    );

    expect(parsed).toEqual({
      amount: 80,
      recipient: "SAHIL YADAV",
      recipient_name: "SAHIL YADAV",
      reference: "214558404246",
      type: "UPI",
      account: "KOTAK",
    });
  });

  it("keeps supporting UPI IDs when Kotak uses the new account marker and spacing", () => {
    const parsed = parseTransactionMessage(
      "Sent Rs.1,100.00 from Kotak Bank A/c X5213 to pandey.pragya9899-1@okhdfcbank on 28-08-26. UPI Ref 313444140776."
    );

    expect(parsed).toEqual({
      amount: 1100,
      recipient: "pandey.pragya9899-1@okhdfcbank",
      reference: "313444140776",
      type: "UPI",
      account: "KOTAK",
    });
  });

  it("parses supported debit and credit card messages", () => {
    expect(
      parseTransactionMessage(
        "Rs.240.46 spent via Kotak Debit Card XX3971 at CONNAUGHT PLAZA GURGAON on 13/09/2025."
      )
    ).toMatchObject({
      amount: 240.46,
      recipient: "CONNAUGHT PLAZA GURGAON",
      type: "CARD",
      account: "KOTAK",
    });

    expect(
      parseTransactionMessage(
        "INR 200 spent on Kotak Credit Card x6387 on 28-FEB-2026 at UPI-600117529647-HAMAN. Avl limit INR 29668.72"
      )
    ).toMatchObject({
      amount: 200,
      recipient: "HAMAN",
      recipient_name: "HAMAN",
      reference: "600117529647",
      type: "CARD",
      account: "KOTAK",
    });

    expect(
      parseTransactionMessage(
        "INR 5977 spent on Kotak Credit Card x6387 on 02-Jul-2026 at UPI-K-309629880406-MAN. Avl limit INR 34023 Fraud? https://kotak.bank.in/KBANKT/CCTXN"
      )
    ).toMatchObject({
      amount: 5977,
      recipient: "MAN",
      recipient_name: "MAN",
      reference: "309629880406",
      type: "CARD",
      account: "KOTAK",
    });
  });

  it("parses HDFC multiline UPI messages", () => {
    const parsed = parseTransactionMessage(
      "Sent Rs.1,234.56\nFrom HDFC Bank A/C 1234\nTo merchant@upi\nOn 12/06/26\nRef 123456789012"
    );

    expect(parsed).toEqual({
      amount: 1234.56,
      recipient: "merchant@upi",
      reference: "123456789012",
      type: "UPI",
      account: "HDFC",
    });
  });

  it("returns null for unsupported messages", () => {
    expect(parseTransactionMessage("hello from a bank with no known format")).toBeNull();
  });
});
