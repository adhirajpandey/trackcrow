import {
  getCreateTransactionDefaultValues,
  mapCreateFormValuesToPayload,
  transactionCreateFormSchema,
} from "./transaction-create-model";

describe("transaction create model", () => {
  it("builds IST-aware defaults for the current time", () => {
    expect(
      getCreateTransactionDefaultValues(new Date("2026-07-12T15:12:00.000Z")),
    ).toEqual({
      amount: "",
      recipientUuid: "",
      categoryUuid: "",
      subcategoryUuid: "",
      type: "UPI",
      timestamp: "2026-07-12T20:42",
      reference: "",
      accountLabel: "",
      remarks: "",
      locationRaw: "",
    });
  });

  it("maps form values to the existing manual transaction API payload", () => {
    expect(
      mapCreateFormValuesToPayload({
        amount: "250.50",
        recipientUuid: "550e8400-e29b-41d4-a716-446655440000",
        categoryUuid: "",
        subcategoryUuid: "",
        type: "UPI",
        timestamp: "2026-07-12T20:42",
        reference: "  UPI-123  ",
        accountLabel: " ",
        remarks: " Ride home ",
        locationRaw: " ",
      }),
    ).toEqual({
      amount: 250.5,
      recipientUuid: "550e8400-e29b-41d4-a716-446655440000",
      categoryUuid: null,
      subcategoryUuid: null,
      type: "UPI",
      timestamp: "2026-07-12T15:12:00.000Z",
      reference: "UPI-123",
      accountLabel: null,
      remarks: "Ride home",
      locationRaw: null,
    });
  });

  it("requires an amount, recipient, and valid timestamp", () => {
    const result = transactionCreateFormSchema.safeParse({
      ...getCreateTransactionDefaultValues(
        new Date("2026-07-12T15:12:00.000Z"),
      ),
      timestamp: "not-a-date",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["amount", "recipientUuid", "timestamp"]),
      );
    }
  });
});
