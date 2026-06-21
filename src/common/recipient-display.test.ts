import { formatRecipientDisplayLabel } from "./recipient-display";

describe("formatRecipientDisplayLabel", () => {
  it("prefers explicit recipient names", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientName: "Vivek Pandey",
        recipientDisplayName: "vivek.pandey5@okhdfcbank",
        recipientRaw: "vivek.pandey5@okhdfcbank",
      })
    ).toBe("Vivek Pandey");
  });

  it("falls back to recipient display name when present", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientName: null,
        recipientDisplayName: "Hamanthi Devi",
        recipientRaw: "hamanthi@upi",
      })
    ).toBe("Hamanthi Devi");
  });

  it("cleans raw handles into readable labels", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "vivek.pandey5@oksbi",
      })
    ).toBe("Vivek Pandey");
  });

  it("normalizes uppercase raw values into title case", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "NAVJYOT SINGH",
      })
    ).toBe("Navjyot Singh");
  });

  it("keeps numeric UPI handles readable when a confident name is unavailable", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "9999991399@pthdfc",
      })
    ).toBe("UPI: 9999991399@pthdfc");
  });

  it("falls back for low-confidence one-letter names", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "Q",
      })
    ).toBe("Unknown recipient");
  });

  it("supports recipient-specific fallback labels", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "Q",
        fallbackLabel: "Unknown recipient",
      })
    ).toBe("Unknown recipient");
  });

  it("treats current and legacy UPI placeholder labels as low confidence", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "upi recipient",
      })
    ).toBe("Unknown recipient");
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "upi payee",
      })
    ).toBe("Unknown recipient");
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "upi merchant",
      })
    ).toBe("Unknown recipient");
  });

  it("strips clear relational suffixes from readable names", () => {
    expect(
      formatRecipientDisplayLabel({
        recipientRaw: "DEEPA PANDEY WO VIVEK PAND...",
      })
    ).toBe("Deepa Pandey");
  });
});
