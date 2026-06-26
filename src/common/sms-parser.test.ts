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
