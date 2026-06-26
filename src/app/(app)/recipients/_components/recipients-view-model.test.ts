import type { RecipientsControlState, RecipientsQueryResult } from "@/features/recipients/types";

import {
  buildFooterSummary,
  buildPageHref,
  buildRecipientsPageData,
  buildResetHref,
  buildSearchHref,
  buildSortHref,
} from "./recipients-view-model";

const baseFilters: RecipientsControlState = {
  q: "biraj",
  page: 2,
  pageSize: 10,
  sortBy: "displayName",
  sortOrder: "asc",
};

const baseResult: RecipientsQueryResult = {
  status: "ready",
  message: null,
  recipients: [
    {
      id: 1,
      uuid: "rcp-1",
      displayName: "Biraj Borah",
      normalizedName: "biraj borah",
      transactionCount: 19,
      identifiers: [
        {
          id: 11,
          uuid: "rid-11",
          kind: "UPI_ID",
          value: "biraj@oksbi",
          normalizedValue: "biraj@oksbi",
        },
        {
          id: 12,
          uuid: "rid-12",
          kind: "TEXT",
          value: "biraj borah",
          normalizedValue: "biraj borah",
        },
        {
          id: 13,
          uuid: "rid-13",
          kind: "PHONE",
          value: "9876543210",
          normalizedValue: "9876543210",
        },
      ],
    },
    {
      id: 2,
      uuid: "rcp-2",
      displayName: "Luxmi Enterprises",
      normalizedName: "luxmi enterprises",
      transactionCount: 4,
      identifiers: [
        {
          id: 21,
          uuid: "rid-21",
          kind: "CARD_MERCHANT",
          value: "LUXMI ENTERPRISES",
          normalizedValue: "luxmi enterprises",
        },
      ],
    },
  ],
};

describe("recipients view model", () => {
  it("builds search, sort, page, and reset hrefs", () => {
    expect(buildSearchHref(baseFilters, "  merchant ")).toBe(
      "/recipients?q=merchant&page=1&sortBy=displayName&sortOrder=asc"
    );
    expect(buildSortHref(baseFilters, "transactionCount")).toBe(
      "/recipients?q=biraj&page=1&sortBy=transactionCount&sortOrder=desc"
    );
    expect(buildPageHref(baseFilters, 3)).toBe(
      "/recipients?q=biraj&page=3&sortBy=displayName&sortOrder=asc"
    );
    expect(buildResetHref()).toBe("/recipients?sortBy=displayName&sortOrder=asc");
  });

  it("matches search against names and identifiers", () => {
    expect(
      buildRecipientsPageData({
        filters: { ...baseFilters, q: "oksbi", page: 1 },
        result: baseResult,
      }).rows
    ).toHaveLength(1);
    expect(
      buildRecipientsPageData({
        filters: { ...baseFilters, q: "card", page: 1 },
        result: baseResult,
      }).rows[0]?.displayName
    ).toBe("Luxmi Enterprises");
  });

  it("sorts by linked transaction count", () => {
    const rows = buildRecipientsPageData({
      filters: {
        ...baseFilters,
        q: "",
        page: 1,
        sortBy: "transactionCount",
        sortOrder: "desc",
      },
      result: baseResult,
    }).rows;

    expect(rows.map((row) => row.displayName)).toEqual([
      "Biraj Borah",
      "Luxmi Enterprises",
    ]);
  });

  it("builds pagination summary and collapses identifier overflow", () => {
    const pageData = buildRecipientsPageData({
      filters: { ...baseFilters, q: "", page: 1 },
      result: {
        ...baseResult,
        recipients: Array.from({ length: 11 }, (_, index) => ({
          ...baseResult.recipients[index === 0 ? 0 : 1],
          id: index + 1,
          uuid: `rcp-${index + 1}`,
          displayName: index === 0 ? "Biraj Borah" : `Recipient ${index}`,
          normalizedName: index === 0 ? "biraj borah" : `recipient ${index}`,
        })),
      },
    });

    expect(pageData.rows[0]?.overflowIdentifierCount).toBe(1);
    expect(buildFooterSummary(pageData.pagination)).toBe("Showing 1 to 10 of 11 recipients");
  });

  it("returns the filtered empty state when search has no matches", () => {
    expect(
      buildRecipientsPageData({
        filters: { ...baseFilters, q: "missing", page: 1 },
        result: baseResult,
      }).emptyState
    ).toBe("filtered");
  });
});
