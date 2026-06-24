import type { CategoryOption, TransactionRecord } from "@/common/types";

import {
  applyTransactionSuggestion,
  buildTransactionQuickChecks,
  getSubcategoryOptions,
  isValidSubcategorySelection,
  mapFormValuesToTransactionPayload,
  mapTransactionToFormValues,
} from "./transaction-detail-model";

const categories: CategoryOption[] = [
  {
    id: 1,
    uuid: "cat-1",
    name: "Food",
    subcategories: [
      {
        id: 11,
        uuid: "sub-11",
        name: "Dinner",
        categoryId: 1,
      },
    ],
  },
  {
    id: 2,
    uuid: "cat-2",
    name: "Transport",
    subcategories: [
      {
        id: 21,
        uuid: "sub-21",
        name: "Cab",
        categoryId: 2,
      },
    ],
  },
];

const transaction: TransactionRecord = {
  id: 42,
  uuid: "txn-42",
  userUuid: "usr-42",
  amount: 1063,
  currency: "INR",
  type: "UPI",
  source: "SMS",
  recipientRaw: "742810776@kotakbank",
  recipientName: "Kotak Bank UPI",
  recipientDisplayName: "Kotak Bank UPI",
  reference: null,
  accountLabel: "Kotak **1234",
  remarks: null,
  locationRaw: null,
  timestamp: "2026-06-24T17:31:00.000Z",
  createdAt: "2026-06-24T17:32:00.000Z",
  updatedAt: "2026-06-24T17:35:00.000Z",
  category: null,
  subcategory: null,
  categoryId: null,
  subcategoryId: null,
};

describe("transaction detail model", () => {
  it("maps transaction records into form defaults with IST datetime-local values", () => {
    expect(mapTransactionToFormValues(transaction)).toEqual({
      amount: "1063",
      recipientRaw: "742810776@kotakbank",
      recipientName: "Kotak Bank UPI",
      categoryId: "",
      subcategoryId: "",
      type: "UPI",
      timestamp: "2026-06-24T23:01",
      reference: "",
      accountLabel: "Kotak **1234",
      remarks: "",
      locationRaw: "",
    });
  });

  it("maps form values into API payloads with null trimming and IST to ISO conversion", () => {
    expect(
      mapFormValuesToTransactionPayload({
        amount: "1063",
        recipientRaw: " 742810776@kotakbank ",
        recipientName: " Kotak Bank UPI ",
        categoryId: "1",
        subcategoryId: "11",
        type: "UPI",
        timestamp: "2026-06-24T23:01",
        reference: " ",
        accountLabel: " Kotak **1234 ",
        remarks: " dinner ",
        locationRaw: "",
      })
    ).toEqual({
      amount: 1063,
      recipientRaw: "742810776@kotakbank",
      recipientName: "Kotak Bank UPI",
      categoryId: 1,
      subcategoryId: 11,
      type: "UPI",
      timestamp: "2026-06-24T17:31:00.000Z",
      reference: null,
      accountLabel: "Kotak **1234",
      remarks: "dinner",
      locationRaw: null,
    });
  });

  it("filters subcategories by category and validates the selected subcategory", () => {
    expect(getSubcategoryOptions(categories, "1")).toEqual(categories[0]?.subcategories);
    expect(isValidSubcategorySelection(categories, "1", "11")).toBe(true);
    expect(isValidSubcategorySelection(categories, "1", "21")).toBe(false);
  });

  it("builds quick checks from category, source, and recipient linkage", () => {
    expect(buildTransactionQuickChecks(transaction)).toEqual([
      { id: "category", label: "Category missing", status: "attention" },
      { id: "source", label: "Source recorded", status: "passed" },
      { id: "recipient", label: "Recipient linked", status: "passed" },
    ]);
  });

  it("applies suggestion names by matching category and subcategory options", () => {
    expect(
      applyTransactionSuggestion(categories, {
        suggestedCategory: "Transport",
        suggestedSubCategory: "Cab",
      })
    ).toEqual({
      categoryId: "2",
      subcategoryId: "21",
      matched: true,
    });

    expect(
      applyTransactionSuggestion(categories, {
        suggestedCategory: "Missing",
        suggestedSubCategory: null,
      })
    ).toEqual({
      categoryId: "",
      subcategoryId: "",
      matched: false,
    });
  });
});
