import type { RecipientsControlState, RecipientsQueryResult } from "@/features/recipients/types";

import {
  buildFooterSummary,
  buildPageHref,
  buildRecipientsPageData,
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
  pagination: {
    page: 2,
    pageSize: 10,
    total: 11,
    totalPages: 2,
    hasNext: false,
    hasPrev: true,
  },
};

describe("recipients view model", () => {
  it("builds search, sort, and page hrefs", () => {
    expect(buildSearchHref(baseFilters, "  merchant ")).toBe(
      "/recipients?q=merchant&page=1&size=10&sortBy=displayName&sortOrder=asc"
    );
    expect(buildSortHref(baseFilters, "transactionCount")).toBe(
      "/recipients?q=biraj&page=1&size=10&sortBy=transactionCount&sortOrder=desc"
    );
    expect(buildPageHref(baseFilters, 3)).toBe(
      "/recipients?q=biraj&page=3&size=10&sortBy=displayName&sortOrder=asc"
    );
  });

  it("maps paged rows and collapses identifier overflow", () => {
    const pageData = buildRecipientsPageData({
      filters: { ...baseFilters, q: "", page: 2 },
      result: baseResult,
    });

    expect(pageData.rows[0]?.identifierChips).toEqual([
      {
        id: "rid-11",
        tone: "upi",
        value: "biraj@oksbi",
      },
      {
        id: "rid-12",
        tone: "text",
        value: "biraj borah",
      },
    ]);
    expect(pageData.rows[1]?.identifierChips).toEqual([
      {
        id: "rid-21",
        tone: "card",
        value: "LUXMI ENTERPRISES",
      },
    ]);
    expect(pageData.rows[0]?.overflowIdentifierCount).toBe(1);
    expect(pageData.pagination).toEqual(baseResult.pagination);
    expect(buildFooterSummary(pageData.pagination)).toBe("Showing 11 to 11 of 11 recipients");
  });

  it("returns the filtered empty state from API totals", () => {
    expect(
      buildRecipientsPageData({
        filters: { ...baseFilters, q: "missing", page: 1 },
        result: {
          ...baseResult,
          recipients: [],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      }).emptyState
    ).toBe("filtered");
  });

  it("returns the empty state when there are no recipients at all", () => {
    expect(
      buildRecipientsPageData({
        filters: { ...baseFilters, q: "", page: 1 },
        result: {
          ...baseResult,
          recipients: [],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      }).emptyState
    ).toBe("empty");
  });

  it("shows zero-to-zero summary for out-of-range pages with no rows", () => {
    expect(
      buildFooterSummary({
        page: 4,
        pageSize: 10,
        total: 11,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      })
    ).toBe("Showing 0 to 0 of 11 recipients");
  });
});
