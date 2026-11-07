import { tidyRecipientName } from "./recipient-name";

describe("tidyRecipientName", () => {
  it.each([
    ["BRAJESH KUMAR RAJPOO", "Brajesh Kumar Rajpoo"],
    ["GROWW INVEST TECH PVT LTD", "Groww Invest Tech Pvt Ltd"],
    ["MUTUAL FUNDS NCL", "Mutual Funds NCL"],
    ["M S KKC FOODS PVT LT", "M S KKC Foods Pvt LT"],
    ["11974APOLLO PHARMACY", "11974APOLLO Pharmacy"],
    ["BIKANERVALA     GURGAON", "Bikanervala Gurgaon"],
    ["WWW AMAZON IN", "WWW Amazon IN"],
    ["HDFC BANK", "HDFC Bank"],
  ])("tidies %s", (input, expected) => {
    expect(tidyRecipientName(input)).toBe(expected);
  });

  it("leaves names that already use lowercase alone", () => {
    expect(tidyRecipientName("Anubhav Chaudhary")).toBe("Anubhav Chaudhary");
    expect(tidyRecipientName("vivek.pandey591@oksbi")).toBe("vivek.pandey591@oksbi");
    expect(tidyRecipientName("airtelcommonpool@mairtel")).toBe("airtelcommonpool@mairtel");
  });
});
