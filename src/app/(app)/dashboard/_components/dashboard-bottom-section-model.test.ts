import type { TransactionListResponse } from "@/common/types";

import {
  buildCategoryQuickTagOptions,
  buildLargestTransactionHref,
  buildRecentTransactionsApiHref,
  dashboardTableLayouts,
  getCategoryTriggerLabel,
  mapTransactionListToDashboardItems,
} from "./dashboard-bottom-section-model";
import {
  dashboardFooterSecondaryLinkClassName,
  dashboardFooterStackClassName,
} from "./dashboard-style";

describe("dashboard bottom section model", () => {
  it("builds filtered recent-transactions API URLs", () => {
    expect(
      buildRecentTransactionsApiHref({
        startDate: "2026-06-01",
        endDate: "2026-06-21",
        query: "Biraj",
        category: "Food",
      })
    ).toBe(
      "/api/transactions?startDate=2026-06-01&endDate=2026-06-21&q=Biraj&category=Food&size=6&sortBy=timestamp&sortOrder=desc"
    );
    expect(
      buildRecentTransactionsApiHref({
        startDate: "2026-06-01",
        endDate: "2026-06-21",
        query: "",
        category: "uncategorized",
      })
    ).toContain("category=Uncategorized");
  });

  it("maps transaction API responses into dashboard recent rows", () => {
    const response: TransactionListResponse = {
      transactions: [
        {
          id: 12,
          uuid: "txn-12",
          userUuid: "user-1",
          amount: 190,
          currency: "INR",
          type: "UPI",
          source: "SMS",
          recipientId: 55,
          recipientRaw: "vivek.pandey5@oksbi",
          recipientName: null,
          recipientDisplayName: "vivek.pandey5@oksbi",
          reference: null,
          accountLabel: null,
          remarks: null,
          locationRaw: null,
          timestamp: "2026-06-20T09:00:00.000Z",
          createdAt: "2026-06-20T09:00:00.000Z",
          updatedAt: "2026-06-20T09:00:00.000Z",
          category: null,
          subcategory: null,
          categoryId: null,
          subcategoryId: null,
        },
      ],
      page: 1,
      pageSize: 6,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      firstTxnDate: null,
      lastTxnDate: null,
    };

    expect(mapTransactionListToDashboardItems(response)).toEqual([
      {
        id: 12,
        uuid: "txn-12",
        recipient: "Vivek Pandey",
        category: null,
        amount: 190,
        timestamp: "2026-06-20T09:00:00.000Z",
        source: "SMS",
      },
    ]);
  });

  it("builds quick-tag options from top-level categories", () => {
    expect(
      buildCategoryQuickTagOptions([
        {
          id: 1,
          uuid: "cat-1",
          name: "Food",
          subcategories: [{ id: 2, uuid: "sub-2", name: "Lunch", categoryId: 1 }],
        },
      ])
    ).toEqual([{ id: 1, label: "Food" }]);
  });

  it("builds the category trigger label for labeled and unlabeled rows", () => {
    expect(getCategoryTriggerLabel(null)).toBe("Select category");
    expect(getCategoryTriggerLabel("Food")).toBe("Food");
  });

  it("builds a transaction detail href for largest transaction rows", () => {
    expect(buildLargestTransactionHref(12)).toBe("/transactions/12");
  });

  it("defines consistent dashboard table layouts and alignment", () => {
    expect(dashboardTableLayouts.spendingByCategory).toEqual({
      columns: ["Category", "Amount", "% of spend"],
      template: "minmax(0,1.55fr) 96px 72px",
      columnWidths: ["58%", "25%", "17%"],
      rightAlignedColumns: [1, 2],
    });
    expect(dashboardTableLayouts.frequentRecipients).toEqual({
      columns: ["Recipient", "Payments", "Amount"],
      template: "minmax(0,1.45fr) 78px 104px",
      columnWidths: ["54%", "22%", "24%"],
      rightAlignedColumns: [1, 2],
    });
    expect(dashboardTableLayouts.largestTransactions).toEqual({
      columns: ["Recipient", "Date", "Amount"],
      template: "minmax(0,1.5fr) 108px 96px",
      columnWidths: ["45%", "31%", "24%"],
      rightAlignedColumns: [2],
    });
    expect(dashboardTableLayouts.recentTransactions.template).toBe(
      "132px minmax(0,1.55fr) 96px minmax(180px,1fr)"
    );
  });

  it("defines a shared footer spacing stack for dashboard footer links", () => {
    expect(dashboardFooterStackClassName).toBe("mt-4 flex flex-col gap-3");
  });

  it("defines a quieter secondary footer link treatment for recent transactions", () => {
    expect(dashboardFooterSecondaryLinkClassName).toContain("cursor-pointer");
    expect(dashboardFooterSecondaryLinkClassName).toContain("bg-transparent");
    expect(dashboardFooterSecondaryLinkClassName).toContain("text-secondary-foreground/92");
  });
});
