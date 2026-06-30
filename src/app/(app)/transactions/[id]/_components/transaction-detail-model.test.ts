import type { CategoryOption, TransactionRecord } from "@/common/types";

import {
  applyTransactionSuggestion,
  buildTransactionQuickChecks,
  getTransactionGoogleMapsHref,
  getRecipientDetailHref,
  getSubcategoryOptions,
  hasTransactionDetailChanges,
  isValidSubcategorySelection,
  mapFormValuesToTransactionPayload,
  mapTransactionToFormValues,
  shouldIgnoreTransactionDetailShortcut,
} from "./transaction-detail-model";

function createShortcutTarget(
  overrides: Partial<{
    tagName: string;
    role: string | null;
    contenteditable: string | null;
    isContentEditable: boolean;
    closest: (selector: string) => unknown;
  }> = {}
) {
  return {
    tagName: overrides.tagName,
    isContentEditable: overrides.isContentEditable ?? false,
    closest: overrides.closest,
    getAttribute(name: string) {
      if (name === "role") {
        return overrides.role ?? null;
      }

      if (name === "contenteditable") {
        return overrides.contenteditable ?? null;
      }

      return null;
    },
  } as EventTarget;
}

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
  recipientId: 30,
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

  it("returns false when form values normalize to the existing transaction payload", () => {
    expect(hasTransactionDetailChanges(transaction, mapTransactionToFormValues(transaction))).toBe(
      false
    );
  });

  it("returns true when a scalar field changes", () => {
    expect(
      hasTransactionDetailChanges(transaction, {
        ...mapTransactionToFormValues(transaction),
        amount: "1200",
      })
    ).toBe(true);
  });

  it("ignores whitespace-only edits that normalize to the same payload", () => {
    expect(
      hasTransactionDetailChanges(transaction, {
        ...mapTransactionToFormValues(transaction),
        recipientRaw: " 742810776@kotakbank ",
        recipientName: " Kotak Bank UPI ",
        accountLabel: " Kotak **1234 ",
      })
    ).toBe(false);
  });

  it("returns true when category or subcategory changes", () => {
    expect(
      hasTransactionDetailChanges(transaction, {
        ...mapTransactionToFormValues(transaction),
        categoryId: "1",
        subcategoryId: "11",
      })
    ).toBe(true);
  });

  it("treats empty strings and null nullable fields as unchanged", () => {
    const nullableTransaction: TransactionRecord = {
      ...transaction,
      recipientName: null,
      reference: null,
      accountLabel: null,
      remarks: null,
      locationRaw: null,
    };

    expect(
      hasTransactionDetailChanges(nullableTransaction, {
        ...mapTransactionToFormValues(nullableTransaction),
        recipientName: "   ",
        reference: " ",
        accountLabel: "",
        remarks: "  ",
        locationRaw: "",
      })
    ).toBe(false);
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

  it("builds the canonical recipient detail href from the linked recipient id", () => {
    expect(getRecipientDetailHref(transaction)).toBe("/recipients/30");
  });

  it("builds a Google Maps search href from coordinate locations", () => {
    expect(getTransactionGoogleMapsHref("28.4622314,77.0874603")).toBe(
      "https://www.google.com/maps/search/28.4622314%2C77.0874603"
    );
    expect(getTransactionGoogleMapsHref(" 28.4622314, 77.0874603 ")).toBe(
      "https://www.google.com/maps/search/28.4622314%2C77.0874603"
    );
  });

  it("returns null for non-coordinate location strings", () => {
    expect(getTransactionGoogleMapsHref("Bangalore office")).toBeNull();
    expect(getTransactionGoogleMapsHref("120.000,77.0874603")).toBeNull();
    expect(getTransactionGoogleMapsHref(null)).toBeNull();
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

  it("does not ignore c and s shortcuts outside editable controls", () => {
    const target = createShortcutTarget({ tagName: "div" });

    expect(
      shouldIgnoreTransactionDetailShortcut({
        defaultPrevented: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        target,
      })
    ).toBe(false);

    expect(["c", "C", "s", "S"].every((key) => ["c", "s"].includes(key.toLowerCase()))).toBe(
      true
    );
  });

  it("ignores shortcuts inside editable controls", () => {
    for (const target of [
      createShortcutTarget({ tagName: "input" }),
      createShortcutTarget({ tagName: "textarea" }),
      createShortcutTarget({ tagName: "select" }),
      createShortcutTarget({ tagName: "button" }),
      createShortcutTarget({ contenteditable: "true" }),
      createShortcutTarget({ role: "textbox" }),
    ]) {
      expect(
        shouldIgnoreTransactionDetailShortcut({
          defaultPrevented: false,
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          shiftKey: false,
          target,
        })
      ).toBe(true);
    }
  });

  it("ignores shortcuts with modifiers or default prevention", () => {
    const target = createShortcutTarget({ tagName: "div" });

    expect(
      shouldIgnoreTransactionDetailShortcut({
        defaultPrevented: true,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        target,
      })
    ).toBe(true);

    for (const modifierState of [
      { ctrlKey: true, metaKey: false, altKey: false, shiftKey: false },
      { ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
      { ctrlKey: false, metaKey: false, altKey: true, shiftKey: false },
      { ctrlKey: false, metaKey: false, altKey: false, shiftKey: true },
    ]) {
      expect(
        shouldIgnoreTransactionDetailShortcut({
          defaultPrevented: false,
          target,
          ...modifierState,
        })
      ).toBe(true);
    }
  });
});
